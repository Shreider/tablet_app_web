package pl.adriantur.stanowisko

import org.json.JSONArray
import org.json.JSONObject

data class AppRule(val packageName: String, val singleSession: Boolean)

object RuleCodec {
    fun encode(rules: List<AppRule>): String =
        JSONArray()
            .apply {
                rules.forEach {
                    put(JSONObject().put("package", it.packageName).put("single", it.singleSession))
                }
            }
            .toString()

    fun decode(raw: String): List<AppRule> =
        JSONArray(raw).let { a ->
            (0 until a.length()).map {
                a.getJSONObject(it).let {
                    AppRule(it.getString("package"), it.getBoolean("single"))
                }
            }
        }
}

object PolicyValidator {
    fun validate(
        rules: List<AppRule>,
        available: Set<String>,
        own: String,
        webEnabled: Boolean = false,
    ): Int? =
        when {
            rules.isEmpty() && !webEnabled -> R.string.error_empty_application_list
            rules.map { it.packageName }.distinct().size != rules.size ->
                R.string.error_duplicate_application
            rules.any { it.packageName == own } -> R.string.error_desktop_application_rule
            rules.any { it.packageName !in available } ->
                R.string.error_selected_application_missing
            else -> null
        }
}
