package pl.adriantur.stanowisko

import android.app.*
import android.content.*
import android.content.res.Configuration
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.os.IBinder
import android.provider.Settings
import android.view.Display
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowInsets
import android.view.WindowManager
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import kotlin.math.abs
import kotlin.math.roundToInt
import kotlinx.coroutines.*

class ExitOverlayService : Service() {
    companion object {
        var ready = CompletableDeferred<Unit>()
    }

    private var controls: LinearLayout? = null
    private var desktopButton: ImageButton? = null
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private lateinit var params: WindowManager.LayoutParams
    private val windowContext by lazy {
        val display =
            getSystemService(DisplayManager::class.java).getDisplay(Display.DEFAULT_DISPLAY)
        createWindowContext(display, WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY, null)
    }
    private val manager
        get() = windowContext.getSystemService(WindowManager::class.java)

    private val positionPrefs by lazy { getSharedPreferences("overlay-position", MODE_PRIVATE) }

    private fun dp(value: Int) =
        (value * windowContext.resources.displayMetrics.density).roundToInt()

    private fun safeInsets() =
        manager.currentWindowMetrics.windowInsets.getInsetsIgnoringVisibility(
            WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout()
        )

    private fun panelWidth(): Int {
        val insets = safeInsets()
        return dp(136)
            .coerceAtMost(
                (manager.currentWindowMetrics.bounds.width() - insets.left - insets.right - dp(16))
                    .coerceAtLeast(1)
            )
    }

    private fun bounds(): FloatingPanelBounds {
        val metrics = manager.currentWindowMetrics
        val insets = safeInsets()
        val minX = insets.left + dp(8)
        val minY = insets.top + dp(8)
        val width = controls?.width?.takeIf { it > 0 } ?: params.width
        val height = controls?.height?.takeIf { it > 0 } ?: dp(64)
        return FloatingPanelBounds(
            minX,
            minY,
            (metrics.bounds.width() - insets.right - dp(8) - width).coerceAtLeast(minX),
            (metrics.bounds.height() - insets.bottom - dp(8) - height).coerceAtLeast(minY),
        )
    }

    private fun restorePosition() {
        val (x, y) =
            bounds().position(positionPrefs.getFloat("x", 1f), positionPrefs.getFloat("y", .15f))
        params.x = x
        params.y = y
        controls?.takeIf { it.isAttachedToWindow }?.let { manager.updateViewLayout(it, params) }
    }

    private fun savePosition() {
        val (x, y) = bounds().fractions(params.x, params.y)
        positionPrefs.edit().putFloat("x", x).putFloat("y", y).apply()
    }

    private fun enableDragging(handle: View) {
        var downX = 0f
        var downY = 0f
        var startX = 0
        var startY = 0
        var dragging = false
        val slop = ViewConfiguration.get(windowContext).scaledTouchSlop
        handle.setOnTouchListener { view, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    downX = event.rawX
                    downY = event.rawY
                    startX = params.x
                    startY = params.y
                    dragging = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - downX
                    val dy = event.rawY - downY
                    if (abs(dx) > slop || abs(dy) > slop) dragging = true
                    if (dragging) {
                        val (x, y) =
                            bounds().clamp(startX + dx.roundToInt(), startY + dy.roundToInt())
                        params.x = x
                        params.y = y
                        controls?.let { manager.updateViewLayout(it, params) }
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (dragging) {
                        val (x, y) =
                            bounds()
                                .clamp(
                                    startX + (event.rawX - downX).roundToInt(),
                                    startY + (event.rawY - downY).roundToInt(),
                                )
                        params.x = x
                        params.y = y
                        controls?.let { manager.updateViewLayout(it, params) }
                        savePosition()
                    } else view.performClick()
                    true
                }
                MotionEvent.ACTION_CANCEL -> {
                    if (dragging) savePosition()
                    true
                }
                else -> false
            }
        }
    }

    private fun updateVisibility(workspaceUiVisible: Boolean) {
        controls?.visibility = if (workspaceUiVisible) View.GONE else View.VISIBLE
    }

    override fun onCreate() {
        super.onCreate()
        serviceScope.launch {
            (application as WorkspaceApp).workspaceUiVisible.collect { updateVisibility(it) }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        try {
            check(Settings.canDrawOverlays(this))
            val app = application as WorkspaceApp
            val singleSession =
                intent?.getBooleanExtra("singleSession", app.engine.session != null)
                    ?: (app.engine.session != null)
            val notifications = getSystemService(NotificationManager::class.java)
            notifications.createNotificationChannel(
                NotificationChannel(
                    "session",
                    getString(R.string.workspace_controls),
                    NotificationManager.IMPORTANCE_LOW,
                )
            )
            startForeground(
                1,
                Notification.Builder(this, "session")
                    .setSmallIcon(R.drawable.ic_workspace)
                    .setContentTitle(
                        if (singleSession) getString(R.string.locked_session)
                        else getString(R.string.workspace_active)
                    )
                    .setContentText(
                        if (app.engine.keepScreenOn) getString(R.string.screen_awake_notification)
                        else getString(R.string.administrator_pin_required)
                    )
                    .build(),
            )
            if (controls == null) {
                fun control(icon: Int, label: String, description: String, action: () -> Unit) =
                    ImageButton(windowContext).apply {
                        setImageResource(icon)
                        scaleType = ImageView.ScaleType.CENTER_INSIDE
                        background =
                            android.graphics.drawable.GradientDrawable().apply {
                                setColor(android.graphics.Color.rgb(12, 32, 45))
                                cornerRadius = 24 * resources.displayMetrics.density
                                setStroke(
                                    (resources.displayMetrics.density).toInt().coerceAtLeast(1),
                                    android.graphics.Color.rgb(49, 83, 98),
                                )
                            }
                        setPadding(dp(12), dp(12), dp(12), dp(12))
                        contentDescription = description
                        tooltipText = label
                        setOnClickListener { action() }
                    }
                controls =
                    LinearLayout(windowContext).apply {
                        orientation = LinearLayout.HORIZONTAL
                        gravity = Gravity.CENTER_VERTICAL
                        setPadding(dp(8), dp(8), dp(8), dp(8))
                        elevation = dp(12).toFloat()
                        background =
                            android.graphics.drawable.GradientDrawable().apply {
                                colors =
                                    intArrayOf(
                                        android.graphics.Color.rgb(20, 49, 64),
                                        android.graphics.Color.rgb(8, 25, 37),
                                    )
                                cornerRadius = dp(20).toFloat()
                                setStroke(
                                    dp(1).coerceAtLeast(1),
                                    android.graphics.Color.rgb(59, 139, 157),
                                )
                            }
                    }
                val handle =
                    ImageView(windowContext).apply {
                        setImageResource(R.drawable.ic_floating_drag)
                        scaleType = ImageView.ScaleType.CENTER
                        contentDescription = getString(R.string.floating_menu_drag)
                        isClickable = true
                    }
                controls!!.addView(handle, LinearLayout.LayoutParams(dp(20), dp(48)))
                enableDragging(handle)
                val buttons =
                    LinearLayout(windowContext).apply { orientation = LinearLayout.HORIZONTAL }
                desktopButton =
                    control(
                        R.drawable.ic_floating_home,
                        "Pulpit",
                        getString(R.string.return_to_desktop),
                    ) {
                        // Stan sesji sprawdzamy przy kliknięciu, niezależnie od wyświetlanej ikony.
                        val single = app.engine.session != null
                        val target =
                            if (single) AuthActivity::class.java else MainActivity::class.java
                        startActivity(
                            Intent(this@ExitOverlayService, target).apply {
                                addFlags(
                                    Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                                )
                                if (single) putExtra(AuthActivity.EXTRA_RETURN_DESKTOP, true)
                            }
                        )
                    }
                buttons.addView(
                    desktopButton,
                    LinearLayout.LayoutParams(0, dp(48), 1f).apply { marginEnd = dp(4) },
                )
                buttons.addView(
                    control(
                        R.drawable.ic_floating_admin,
                        getString(R.string.administrator),
                        getString(R.string.open_administrator_panel),
                    ) {
                        startActivity(
                            Intent(this@ExitOverlayService, AuthActivity::class.java)
                                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        )
                    },
                    LinearLayout.LayoutParams(0, dp(48), 1f),
                )
                controls!!.addView(buttons, LinearLayout.LayoutParams(0, dp(48), 1f))
                params =
                    WindowManager.LayoutParams(
                            panelWidth(),
                            WindowManager.LayoutParams.WRAP_CONTENT,
                            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                            PixelFormat.TRANSLUCENT,
                        )
                        .apply {
                            @Suppress("RtlHardcoded")
                            gravity = Gravity.TOP or Gravity.LEFT
                            setFitInsetsTypes(0)
                            title = getString(R.string.workspace_controls)
                        }
                restorePosition()
                controls!!.addOnLayoutChangeListener {
                    _,
                    left,
                    top,
                    right,
                    bottom,
                    oldLeft,
                    oldTop,
                    oldRight,
                    oldBottom ->
                    if (right - left != oldRight - oldLeft || bottom - top != oldBottom - oldTop)
                        restorePosition()
                }
                manager.addView(controls, params)
            }
            desktopButton?.setImageResource(
                if (singleSession) R.drawable.ic_floating_lock else R.drawable.ic_floating_home
            )
            desktopButton?.tooltipText =
                if (singleSession) getString(R.string.return_with_pin_hint) else "Pulpit"
            desktopButton?.contentDescription =
                if (singleSession) getString(R.string.return_to_desktop_with_pin)
                else getString(R.string.return_to_desktop)
            params.flags =
                if (app.engine.keepScreenOn)
                    params.flags or WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                else params.flags and WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON.inv()
            manager.updateViewLayout(controls, params)
            updateVisibility(app.workspaceUiVisible.value)
            ready.complete(Unit)
        } catch (e: Exception) {
            ready.completeExceptionally(e)
            stopSelf()
        }
        return START_STICKY
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        if (controls != null) {
            params.width = panelWidth()
            manager.updateViewLayout(controls, params)
            restorePosition()
        }
    }

    override fun onDestroy() {
        serviceScope.cancel()
        controls?.takeIf { it.isAttachedToWindow }?.let { manager.removeView(it) }
        controls = null
        desktopButton = null
        super.onDestroy()
    }
}
