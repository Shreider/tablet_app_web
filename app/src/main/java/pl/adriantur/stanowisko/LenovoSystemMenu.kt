package pl.adriantur.stanowisko

import android.os.Build
import android.provider.Settings

// Menu producenta może być widoczne, ale nie blokuje odtwarzania ochrony.
class LenovoSystemMenu(private val app: WorkspaceApp) {
    private val key = "enable_temp_zuifreeformbar"
    val supported
        get() =
            Build.MANUFACTURER.equals("LENOVO", true) &&
                Build.MODEL == "TB311FU" &&
                Build.DEVICE == "TB311FU" &&
                Settings.System.getString(app.contentResolver, key) != null

    val requiresPreparation
        get() = supported && Settings.System.getString(app.contentResolver, key) != "0"
}
