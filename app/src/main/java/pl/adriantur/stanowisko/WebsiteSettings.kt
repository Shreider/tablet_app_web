package pl.adriantur.stanowisko

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

@Composable
internal fun WebsiteSettings(
    savedPage: WebPageConfig,
    busy: Boolean,
    save: (WebPageConfig, String) -> Unit,
) {
    val resources = LocalResources.current
    var draft by remember(savedPage) { mutableStateOf(savedPage) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(resources.getString(R.string.website), style = MaterialTheme.typography.titleLarge)
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Switch(
                        savedPage.enabled,
                        { enabled ->
                            val page =
                                if (enabled) draft.copy(enabled = true)
                                else savedPage.copy(enabled = false)
                            save(
                                page,
                                if (enabled) resources.getString(R.string.website_enabled)
                                else resources.getString(R.string.website_disabled),
                            )
                        },
                        enabled = !busy,
                        modifier =
                            Modifier.semantics {
                                contentDescription = resources.getString(R.string.enable_website)
                            },
                    )
                    Text(
                        resources.getString(R.string.enable_website),
                        Modifier.padding(start = 8.dp),
                    )
                }
                Text(
                    resources.getString(R.string.website_enabled_help),
                    style = MaterialTheme.typography.bodySmall,
                )
                OutlinedTextField(
                    draft.title,
                    { draft = draft.copy(title = it.take(60)) },
                    label = { Text(resources.getString(R.string.website_title)) },
                    singleLine = true,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    draft.url,
                    { draft = draft.copy(url = it.take(2048)) },
                    label = { Text(resources.getString(R.string.website_url)) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    draft.additionalUrls,
                    { draft = draft.copy(additionalUrls = it.take(16_384)) },
                    label = { Text(resources.getString(R.string.website_allowed_addresses)) },
                    minLines = 2,
                    maxLines = 4,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                )
                Text(
                    resources.getString(R.string.website_allowed_addresses_help),
                    style = MaterialTheme.typography.bodySmall,
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Switch(
                        draft.singleSession,
                        { draft = draft.copy(singleSession = it) },
                        enabled = !busy,
                        modifier =
                            Modifier.semantics {
                                contentDescription =
                                    resources.getString(R.string.website_single_mode_switch)
                            },
                    )
                    Text(
                        if (draft.singleSession) resources.getString(R.string.mode_single)
                        else resources.getString(R.string.mode_multiple),
                        Modifier.padding(start = 8.dp),
                    )
                }
                Text(
                    if (draft.singleSession) resources.getString(R.string.website_single_mode_help)
                    else resources.getString(R.string.website_multiple_mode_help),
                    style = MaterialTheme.typography.bodySmall,
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        draft.javaScript,
                        { draft = draft.copy(javaScript = it) },
                        enabled = !busy,
                        modifier =
                            Modifier.semantics {
                                contentDescription = resources.getString(R.string.website_scripts)
                            },
                    )
                    Text(resources.getString(R.string.website_scripts))
                }
                Button(
                    enabled = !busy,
                    onClick = {
                        save(
                            draft,
                            resources.getString(R.string.website_settings_saved),
                        )
                    },
                ) {
                    Text(resources.getString(R.string.save_website_settings))
                }
            }
        }
    }
}
