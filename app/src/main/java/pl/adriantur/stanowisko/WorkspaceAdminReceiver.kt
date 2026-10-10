package pl.adriantur.stanowisko

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import kotlinx.coroutines.launch

class WorkspaceAdminReceiver : DeviceAdminReceiver() {
    override fun onLockTaskModeEntering(context: Context, intent: Intent, pkg: String) {
        log(context, "LOCK_TASK_ENTER", pkg)
    }

    override fun onLockTaskModeExiting(context: Context, intent: Intent) {
        log(context, "LOCK_TASK_EXIT", "")
    }

    private fun log(context: Context, kind: String, detail: String) {
        val pending = goAsync()
        val app = context.applicationContext as WorkspaceApp
        app.scope.launch {
            try {
                app.audit(kind, detail)
            } finally {
                pending.finish()
            }
        }
    }
}
