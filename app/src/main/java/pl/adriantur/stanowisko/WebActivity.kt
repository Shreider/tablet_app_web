package pl.adriantur.stanowisko

import android.app.ActivityManager
import android.content.Intent
import android.graphics.Color
import android.net.http.SslError
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.webkit.*
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.addCallback

// Strona działa we własnym zadaniu; linki nie uruchamiają zewnętrznych aplikacji.
class WebActivity : ComponentActivity() {
    private val app
        get() = application as WorkspaceApp

    private var browser: WebView? = null
    private lateinit var message: TextView
    private lateinit var errorPanel: LinearLayout
    private lateinit var page: WebPageConfig

    private fun sessionMatches() =
        if (page.singleSession) app.engine.session == PolicyEngine.WEB_SESSION
        else app.engine.session == null

    private fun error(text: String) {
        message.text = text
        errorPanel.visibility = View.VISIBLE
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        page = app.web.config.value
        val root = FrameLayout(this).apply { setBackgroundColor(Color.rgb(5, 14, 23)) }
        message =
            TextView(this).apply {
                setTextColor(Color.rgb(255, 180, 171))
                textSize = 18f
            }
        errorPanel =
            LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(32, 32, 32, 32)
                setBackgroundColor(Color.rgb(12, 32, 45))
                visibility = View.GONE
                addView(message)
                addView(
                    Button(this@WebActivity).apply {
                        text = getString(R.string.retry)
                        setOnClickListener {
                            if (browser == null) recreate()
                            else {
                                errorPanel.visibility = View.GONE
                                browser?.loadUrl(page.url)
                            }
                        }
                    }
                )
                addView(
                    Button(this@WebActivity).apply {
                        text = getString(R.string.administrator)
                        setOnClickListener {
                            startActivity(
                                Intent(this@WebActivity, AuthActivity::class.java)
                                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            )
                        }
                    }
                )
            }
        try {
            browser =
                WebView(this).apply {
                    settings.javaScriptEnabled = page.javaScript
                    settings.domStorageEnabled = true
                    settings.allowFileAccess = false
                    settings.allowContentAccess = false
                    settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                    settings.safeBrowsingEnabled = true
                    settings.setSupportMultipleWindows(false)
                    settings.javaScriptCanOpenWindowsAutomatically = false
                    settings.disabledActionModeMenuItems =
                        WebSettings.MENU_ITEM_SHARE or
                            WebSettings.MENU_ITEM_WEB_SEARCH or
                            WebSettings.MENU_ITEM_PROCESS_TEXT
                    importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS
                    webViewClient =
                        object : WebViewClient() {
                            override fun shouldInterceptRequest(
                                view: WebView,
                                request: WebResourceRequest,
                            ): WebResourceResponse? {
                                // Główne żądania POST omijają shouldOverrideUrlLoading, więc
                                // sprawdzamy je tutaj.
                                if (
                                    request.isForMainFrame && !page.allows(request.url.toString())
                                ) {
                                    view.post {
                                        error(getString(R.string.error_website_address))
                                    }
                                    return WebResourceResponse(
                                        "text/plain",
                                        "UTF-8",
                                        403,
                                        "Blocked",
                                        emptyMap(),
                                        java.io.ByteArrayInputStream(ByteArray(0)),
                                    )
                                }
                                return null
                            }

                            override fun onPageStarted(
                                view: WebView,
                                url: String,
                                favicon: android.graphics.Bitmap?,
                            ) {
                                if (!page.allows(url)) {
                                    view.stopLoading()
                                    error(getString(R.string.error_website_address))
                                }
                            }

                            override fun shouldOverrideUrlLoading(
                                view: WebView,
                                request: WebResourceRequest,
                            ): Boolean {
                                if (page.allows(request.url.toString())) return false
                                error(getString(R.string.error_website_address_help))
                                return true
                            }

                            override fun onReceivedSslError(
                                view: WebView,
                                handler: SslErrorHandler,
                                failure: SslError,
                            ) {
                                handler.cancel()
                                error(getString(R.string.error_website_certificate))
                            }

                            override fun onReceivedError(
                                view: WebView,
                                request: WebResourceRequest,
                                failure: WebResourceError,
                            ) {
                                if (request.isForMainFrame)
                                    error(getString(R.string.error_website_connection))
                            }

                            override fun onRenderProcessGone(
                                view: WebView,
                                detail: RenderProcessGoneDetail,
                            ): Boolean {
                                root.removeView(view)
                                view.destroy()
                                browser = null
                                error(
                                    if (page.singleSession)
                                        getString(R.string.error_website_renderer_single)
                                    else getString(R.string.error_website_renderer_multiple)
                                )
                                return true
                            }
                        }
                    webChromeClient =
                        object : WebChromeClient() {
                            override fun onPermissionRequest(request: PermissionRequest) {
                                request.deny()
                            }

                            override fun onGeolocationPermissionsShowPrompt(
                                origin: String,
                                callback: GeolocationPermissions.Callback,
                            ) {
                                callback.invoke(origin, false, false)
                            }

                            override fun onShowFileChooser(
                                view: WebView,
                                callback: ValueCallback<Array<android.net.Uri>>,
                                params: FileChooserParams,
                            ): Boolean {
                                callback.onReceiveValue(null)
                                error(getString(R.string.error_website_file_selection))
                                return true
                            }
                        }
                    setDownloadListener { _, _, _, _, _ ->
                        error(getString(R.string.error_website_download))
                    }
                }
            root.addView(
                browser,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT,
                ),
            )
        } catch (_: Exception) {
            error(getString(R.string.error_website_engine))
        }
        root.addView(
            errorPanel,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.TOP,
            ),
        )
        setContentView(root)
        onBackPressedDispatcher.addCallback(this) {
            if (browser?.canGoBack() == true) browser?.goBack()
            else if (!page.singleSession && sessionMatches()) {
                startActivity(
                    Intent(this@WebActivity, MainActivity::class.java)
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                )
                finishAndRemoveTask()
            }
        }
        if (page.enabled && page.validationError() == null && sessionMatches())
            browser?.loadUrl(page.url)
        else error(getString(R.string.error_website_not_prepared))
    }

    override fun onResume() {
        super.onResume()
        if (
            !sessionMatches() ||
                !app.web.config.value.enabled ||
                !app.engine.owner ||
                app.engine.lockState != ActivityManager.LOCK_TASK_MODE_LOCKED
        ) {
            browser?.stopLoading()
            finish()
            return
        }
        window.keepAwake(app.engine.keepScreenOn)
        window.systemBarsHidden(app.engine.hideSystemBars)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) window.systemBarsHidden(app.engine.hideSystemBars)
    }

    override fun onDestroy() {
        browser?.let {
            (it.parent as? android.view.ViewGroup)?.removeView(it)
            it.destroy()
        }
        browser = null
        super.onDestroy()
    }
}
