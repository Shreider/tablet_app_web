package pl.adriantur.stanowisko

import android.content.Context
import java.net.URI
import java.util.Locale
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

data class WebPageConfig(
    val enabled: Boolean = false,
    val title: String = "Strona internetowa",
    val url: String = "",
    val additionalUrls: String = "",
    val javaScript: Boolean = true,
    val singleSession: Boolean = true,
) {
    val origins
        get() =
            (listOf(url) + additionalUrls.lineSequence().filter { it.isNotBlank() }.toList())
                .mapNotNull(WebAddress::origin)
                .toSet()

    fun allows(address: String) = WebAddress.origin(address)?.let { it in origins } == true

    fun validationError(): Int? =
        when {
            title.isBlank() || title.length > 60 -> R.string.error_website_title
            enabled && WebAddress.origin(url) == null -> R.string.error_website_url
            additionalUrls.length > 16_384 ||
                additionalUrls
                    .lineSequence()
                    .filter { it.isNotBlank() }
                    .any { WebAddress.origin(it.trim()) == null } ->
                R.string.error_website_allowed_addresses
            else -> null
        }
}

object WebAddress {
    fun origin(address: String): String? =
        try {
            if (address.length > 2048 || address != address.trim()) null
            else {
                val uri = URI(address)
                val scheme = uri.scheme?.lowercase(Locale.ROOT)
                val defaultPort = if (scheme == "http") 80 else 443
                if (
                    scheme !in setOf("http", "https") ||
                        uri.host.isNullOrBlank() ||
                        uri.rawUserInfo != null ||
                        (uri.port != -1 && uri.port !in 1..65535)
                )
                    null
                else
                    URI(
                            scheme,
                            null,
                            uri.host.lowercase(Locale.ROOT),
                            if (uri.port == defaultPort) -1 else uri.port,
                            null,
                            null,
                            null,
                        )
                        .toASCIIString()
            }
        } catch (_: Exception) {
            null
        }
}

class WebPageStore(private val context: Context) {
    private val prefs = context.getSharedPreferences("web-page", Context.MODE_PRIVATE)
    private val state =
        MutableStateFlow(
            WebPageConfig(
                prefs.getBoolean("enabled", false),
                prefs.getString("title", "Strona internetowa")!!.let {
                    if (it == "WebView") "Strona internetowa" else it
                },
                prefs.getString("url", "")!!,
                prefs.getString("additionalUrls", "")!!,
                prefs.getBoolean("javaScript", true),
                prefs.getBoolean("singleSession", true),
            )
        )
    val config = state.asStateFlow()

    internal fun save(value: WebPageConfig) {
        val normalized =
            value.copy(
                title = value.title.trim(),
                url = value.url.trim(),
                additionalUrls =
                    value.additionalUrls
                        .lineSequence()
                        .map { it.trim() }
                        .filter { it.isNotEmpty() }
                        .joinToString("\n"),
            )
        normalized.validationError()?.let { workspaceError(context.getString(it)) }
        checkWorkspace(
            prefs
                .edit()
                .putBoolean("enabled", normalized.enabled)
                .putString("title", normalized.title)
                .putString("url", normalized.url)
                .putString("additionalUrls", normalized.additionalUrls)
                .putBoolean("javaScript", normalized.javaScript)
                .putBoolean("singleSession", normalized.singleSession)
                .commit()
        ) {
            context.getString(R.string.error_website_save)
        }
        state.value = normalized
    }
}
