package pl.adriantur.stanowisko

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import kotlinx.coroutines.launch

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (
            intent.action !in setOf(Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED)
        )
            return
        val pending = goAsync()
        val app = context.applicationContext as WorkspaceApp
        app.scope.launch {
            try {
                if (app.engine.owner && app.db.dao().policy()?.enabled == true) {
                    context.startActivity(
                        Intent(context, MainActivity::class.java)
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    )
                    app.audit("BOOT_RESTORE_REQUEST")
                }
            } catch (e: Exception) {
                app.audit("BOOT_ERROR", e.javaClass.simpleName)
            } finally {
                pending.finish()
            }
        }
    }
}
