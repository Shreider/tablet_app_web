package pl.adriantur.stanowisko

import android.app.Activity
import android.app.Application
import android.os.Bundle
import androidx.room.*
import java.lang.ref.WeakReference
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow

class WorkspaceApp : Application() {
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    val db by lazy {
        Room.databaseBuilder(this, WorkspaceDatabase::class.java, "workspace.db")
            .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
            .build()
    }
    val pin by lazy { PinStore(this) }
    val initialization by lazy {
        scope.async(start = CoroutineStart.LAZY) { pin.initializeDefault() }
    }
    val engine by lazy { PolicyEngine(this) }
    val permissions by lazy { AppPermissionManager(this) }
    val web by lazy { WebPageStore(this) }
    val systemMenu by lazy { LenovoSystemMenu(this) }
    var adminUntil = 0L
    val workspaceUiVisible = MutableStateFlow(false)
    private var foregroundActivity = WeakReference<Activity>(null)

    override fun onCreate() {
        super.onCreate()
        val languages = android.os.LocaleList.forLanguageTags("pl")
        val localeManager = getSystemService(android.app.LocaleManager::class.java)
        if (localeManager.applicationLocales != languages)
            localeManager.applicationLocales = languages
        registerActivityLifecycleCallbacks(
            object : ActivityLifecycleCallbacks {
                override fun onActivityResumed(activity: Activity) {
                    foregroundActivity = WeakReference(activity)
                    workspaceUiVisible.value = activity !is WebActivity
                }

                override fun onActivityStopped(activity: Activity) {
                    // Zatrzymanie starego pulpitu nie może odebrać dostępu nowemu oknu
                    // administratora.
                    if (
                        foregroundActivity.get() === activity && !activity.isChangingConfigurations
                    ) {
                        adminUntil = 0
                        foregroundActivity = WeakReference(null)
                    }
                }

                override fun onActivityCreated(activity: Activity, state: Bundle?) {}

                override fun onActivityStarted(activity: Activity) {}

                override fun onActivityPaused(activity: Activity) {
                    if (foregroundActivity.get() === activity) workspaceUiVisible.value = false
                }

                override fun onActivitySaveInstanceState(activity: Activity, state: Bundle) {}

                override fun onActivityDestroyed(activity: Activity) {}
            }
        )
        initialization.start()
    }

    fun authorized() = android.os.SystemClock.elapsedRealtime() < adminUntil

    fun requireAdmin() {
        checkWorkspace(authorized()) { getString(R.string.error_administrator_authorization) }
    }

    suspend fun audit(kind: String, detail: String = "") {
        db.dao().log(AuditEvent(kind = kind, detail = detail))
        db.dao().trim()
    }
}
