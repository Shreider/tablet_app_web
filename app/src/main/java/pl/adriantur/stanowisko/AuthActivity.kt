package pl.adriantur.stanowisko

import android.content.Intent
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.*

class AuthActivity : ComponentActivity() {
    companion object {
        const val EXTRA_PERMISSION_PACKAGE = "pl.adriantur.stanowisko.PERMISSION_PACKAGE"
        const val EXTRA_RETURN_DESKTOP = "pl.adriantur.stanowisko.RETURN_DESKTOP"
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) window.systemBarsHidden((application as WorkspaceApp).engine.hideSystemBars)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val barColor = android.graphics.Color.rgb(5, 14, 23)
        enableEdgeToEdge(SystemBarStyle.dark(barColor), SystemBarStyle.dark(barColor))
        window.isNavigationBarContrastEnforced = false
        overrideActivityTransition(OVERRIDE_TRANSITION_OPEN, 0, 0)
        overrideActivityTransition(OVERRIDE_TRANSITION_CLOSE, 0, 0)
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        window.setHideOverlayWindows(true)
        setContent {
            WorkspaceTheme {
                val app = application as WorkspaceApp
                DisposableEffect(Unit) {
                    window.keepAwake(app.engine.keepScreenOn)
                    window.systemBarsHidden(app.engine.hideSystemBars)
                    onDispose {
                        window.keepAwake(false)
                        window.systemBarsHidden(false)
                    }
                }
                var pin by remember { mutableStateOf("") }
                var error by remember { mutableStateOf("") }
                var busy by remember { mutableStateOf(false) }
                val scope = rememberCoroutineScope()
                BackHandler {
                    app.scope.launch { app.audit("AUTH_CANCEL") }
                    finish()
                }
                WorkspaceBackdrop {
                    Box(
                        Modifier.fillMaxSize().safeDrawingPadding().imePadding(),
                        contentAlignment = Alignment.Center,
                    ) {
                        Column(
                            Modifier.widthIn(max = 460.dp)
                                .fillMaxWidth()
                                .verticalScroll(rememberScrollState())
                                .padding(28.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                        ) {
                            AuthEmblem()
                            Text(
                                app.getString(R.string.administrator_authorization),
                                style = MaterialTheme.typography.headlineMedium,
                            )
                            Text(
                                when {
                                    intent.hasExtra(EXTRA_PERMISSION_PACKAGE) ->
                                        app.getString(R.string.permission_authorization_help)
                                    intent.getBooleanExtra(EXTRA_RETURN_DESKTOP, false) ->
                                        app.getString(R.string.session_end_authorization_help)
                                    else -> app.getString(R.string.administrator_authorization_help)
                                },
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            AdministratorPinField(pin, { pin = it })
                            if (error.isNotEmpty())
                                Text(error, color = MaterialTheme.colorScheme.error)
                            Button(
                                enabled = !busy,
                                onClick = {
                                    val value = pin
                                    pin = ""
                                    busy = true
                                    scope.launch {
                                        try {
                                            if (app.pin.verify(value)) {
                                                app.audit("AUTH_SUCCESS")
                                                app.adminUntil =
                                                    android.os.SystemClock.elapsedRealtime() +
                                                        120_000
                                                val returnDesktop =
                                                    intent.getBooleanExtra(
                                                        EXTRA_RETURN_DESKTOP,
                                                        false,
                                                    )
                                                val requested =
                                                    (if (returnDesktop) null
                                                        else
                                                            intent.getStringExtra(
                                                                EXTRA_PERMISSION_PACKAGE
                                                            ) ?: app.engine.session)
                                                        ?.takeUnless {
                                                            it == PolicyEngine.WEB_SESSION
                                                        }
                                                val prepare = requested?.takeIf { pkg ->
                                                    withContext(Dispatchers.IO) {
                                                        app.permissions.list(pkg).any {
                                                            !it.prepared
                                                        }
                                                    }
                                                }
                                                if (app.engine.session != null)
                                                    app.engine.endSession()
                                                if (returnDesktop) app.adminUntil = 0
                                                startActivity(
                                                    Intent(
                                                            this@AuthActivity,
                                                            MainActivity::class.java,
                                                        )
                                                        .addFlags(
                                                            Intent.FLAG_ACTIVITY_NEW_TASK or
                                                                Intent.FLAG_ACTIVITY_CLEAR_TOP
                                                        )
                                                        .apply {
                                                            if (prepare != null)
                                                                putExtra(
                                                                    EXTRA_PERMISSION_PACKAGE,
                                                                    prepare,
                                                                )
                                                        }
                                                )
                                                finish()
                                            } else {
                                                app.audit("AUTH_FAILURE")
                                                error = app.getString(R.string.incorrect_pin)
                                            }
                                        } catch (e: Exception) {
                                            app.adminUntil = 0
                                            app.audit("AUTH_ERROR", e.javaClass.simpleName)
                                            error = e.messageForUser(app)
                                        } finally {
                                            busy = false
                                        }
                                    }
                                },
                            ) {
                                Text(
                                    if (busy) "Sprawdzanie…"
                                    else app.getString(R.string.confirm_pin)
                                )
                            }
                            OutlinedButton(
                                enabled = !busy,
                                onClick = {
                                    app.scope.launch { app.audit("AUTH_CANCEL") }
                                    finish()
                                },
                            ) {
                                Text(app.getString(R.string.cancel))
                            }
                        }
                    }
                }
            }
        }
    }
}
