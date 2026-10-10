package pl.adriantur.stanowisko

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation

@Composable
internal fun AdministratorPinField(pin: String, update: (String) -> Unit, label: String? = null) {
    val resources = LocalResources.current
    OutlinedTextField(
        value = pin,
        onValueChange = { if (it.length <= 12 && it.all { c -> c in '0'..'9' }) update(it) },
        label = { Text(label ?: resources.getString(R.string.administrator_pin)) },
        visualTransformation = PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
    )
}
