package pl.adriantur.stanowisko

import android.app.*
import android.app.admin.DevicePolicyManager
import android.content.*
import android.content.pm.PackageManager
import android.graphics.drawable.Drawable
import android.os.UserManager
import android.provider.Settings
import java.lang.ref.WeakReference
import kotlinx.coroutines.*
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONObject

data class InstalledApp(val packageName: String, val label: String, val icon: Drawable)

class PolicyEngine(private val app: WorkspaceApp) {
    companion object {
        const val WEB_SESSION = "stanowisko:web"
    }

    val dpm = app.getSystemService(DevicePolicyManager::class.java)
    val admin = ComponentName(app, WorkspaceAdminReceiver::class.java)
    private val prefs = app.getSharedPreferences("runtime", Context.MODE_PRIVATE)
    private val mutex = Mutex()
    private var lockRootActivity = WeakReference<Activity>(null)
    private var lockRootTaskId: Int? = null

    fun attach(activity: Activity) {
        if (activity.taskId == lockRootTaskId) lockRootActivity = WeakReference(activity)
    }

    private suspend fun startProtection(activity: Activity) {
        if (lockState == ActivityManager.LOCK_TASK_MODE_NONE || lockRootTaskId == null) {
            lockRootTaskId = activity.taskId
            lockRootActivity = WeakReference(activity)
        }
        activity.startLockTask()
        awaitLockState(ActivityManager.LOCK_TASK_MODE_LOCKED)
    }

    val owner
        get() = dpm.isDeviceOwnerApp(app.packageName)

    val session
        get() = prefs.getString("session", null)

    val keepScreenOn
        get() = prefs.getBoolean("keepScreenOn", false)

    val hideSystemBars
        get() = prefs.getBoolean("hideSystemBars", false)

    val lockState
        get() = app.getSystemService(ActivityManager::class.java).lockTaskModeState

    val home
        get() =
            app.packageManager
                .resolveActivity(
                    Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME),
                    PackageManager.MATCH_DEFAULT_ONLY,
                )
                ?.activityInfo
                ?.packageName == app.packageName

    fun installed(): List<InstalledApp> =
        app.packageManager
            .queryIntentActivities(
                Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER),
                0,
            )
            .filter { it.activityInfo.packageName != app.packageName }
            .distinctBy { it.activityInfo.packageName }
            .map {
                InstalledApp(
                    it.activityInfo.packageName,
                    it.loadLabel(app.packageManager).toString(),
                    it.loadIcon(app.packageManager),
                )
            }
            .sortedBy { it.label.lowercase() }

    private fun packages(rules: List<AppRule>) =
        (listOf(app.packageName) + rules.map { it.packageName }).toTypedArray()

    private fun features(single: Boolean, hideBars: Boolean) =
        DevicePolicyManager.LOCK_TASK_FEATURE_BLOCK_ACTIVITY_START_IN_TASK or
            (if (!single && !hideBars) DevicePolicyManager.LOCK_TASK_FEATURE_HOME else 0) or
            (if (!hideBars) DevicePolicyManager.LOCK_TASK_FEATURE_SYSTEM_INFO else 0)

    private fun secureOtherLaunchers() {
        val before = JSONObject(prefs.getString("hiddenLaunchers", "{}")!!)
        // Pomijamy awaryjne ekrany Androida, ale uwzględniamy pulpity ukryte wcześniej.
        val candidates =
            app.packageManager
                .queryIntentActivities(
                    Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME),
                    PackageManager.MATCH_UNINSTALLED_PACKAGES,
                )
                .filter { it.priority >= 0 }
                .map { it.activityInfo.packageName }
                .filter { it != app.packageName }
                .toSet()
        for (pkg in before.keys().asSequence().toList().filter { it !in candidates }) {
            val hidden = before.getBoolean(pkg)
            checkWorkspace(
                dpm.isApplicationHidden(admin, pkg) == hidden ||
                    dpm.setApplicationHidden(admin, pkg, hidden)
            ) {
                app.getString(R.string.error_restore_application, pkg)
            }
            before.remove(pkg)
        }
        for (pkg in candidates) if (!before.has(pkg))
            before.put(pkg, dpm.isApplicationHidden(admin, pkg))
        // Zapis przed ukryciem pozwala przywrócić poprzedni stan również po restarcie.
        checkWorkspace(prefs.edit().putString("hiddenLaunchers", before.toString()).commit())
        for (pkg in before.keys()) {
            checkWorkspace(
                dpm.isApplicationHidden(admin, pkg) || dpm.setApplicationHidden(admin, pkg, true)
            ) {
                app.getString(R.string.error_secure_home, pkg)
            }
        }
    }

    private fun restoreOtherLaunchers() {
        val before = JSONObject(prefs.getString("hiddenLaunchers", "{}")!!)
        for (pkg in before.keys()) {
            val hidden = before.getBoolean(pkg)
            checkWorkspace(
                dpm.isApplicationHidden(admin, pkg) == hidden ||
                    dpm.setApplicationHidden(admin, pkg, hidden)
            ) {
                app.getString(R.string.error_restore_home, pkg)
            }
        }
        checkWorkspace(prefs.edit().remove("hiddenLaunchers").commit())
    }

    private fun setPolicy(rules: List<AppRule>, single: Boolean, hideBars: Boolean) {
        checkWorkspace(owner) {
            app.getString(R.string.error_device_not_managed)
        }
        dpm.setLockTaskFeatures(admin, features(single, hideBars))
        dpm.setLockTaskPackages(admin, packages(rules))
        val filter =
            IntentFilter(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
                addCategory(Intent.CATEGORY_DEFAULT)
            }
        dpm.addPersistentPreferredActivity(
            admin,
            filter,
            ComponentName(app, MainActivity::class.java),
        )
        secureOtherLaunchers()
        dpm.addUserRestriction(admin, UserManager.DISALLOW_SAFE_BOOT)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_ADD_USER)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_CONFIG_DATE_TIME)
        checkWorkspace(
            dpm.getLockTaskPackages(admin).toSet() == packages(rules).toSet() &&
                dpm.getLockTaskFeatures(admin) == features(single, hideBars) &&
                home
        ) {
            app.getString(R.string.error_policy_verification)
        }
    }

    private suspend fun awaitLockState(expected: Int) {
        checkWorkspace(
            withTimeoutOrNull(5000) {
                while (lockState != expected) delay(50)
                true
            } == true
        ) {
            app.getString(
                R.string.error_lock_state,
                lockStateLabel(app, expected),
                lockStateLabel(app, lockState),
            )
        }
    }

    suspend fun save(
        rules: List<AppRule>,
        keepScreenOn: Boolean = false,
        hideSystemBars: Boolean = false,
    ) = mutex.withLock {
        app.requireAdmin()
        PolicyValidator.validate(
                rules,
                withContext(Dispatchers.IO) { installed().map { it.packageName }.toSet() },
                app.packageName,
                app.web.config.value.enabled,
            )
            ?.let { workspaceError(app.getString(it)) }
        val old = app.db.dao().policy() ?: PolicyRecord()
        app.db
            .dao()
            .put(
                old.copy(
                    revision = old.revision + 1,
                    rules = RuleCodec.encode(rules),
                    keepScreenOn = keepScreenOn,
                    hideSystemBars = hideSystemBars,
                    error = "",
                )
            )
        app.audit("POLICY_SAVED")
    }

    suspend fun apply(activity: Activity) = mutex.withLock {
        app.requireAdmin()
        checkWorkspace(app.pin.configured)
        checkWorkspace(session == null)
        checkWorkspace(!app.getSystemService(KeyguardManager::class.java).isKeyguardLocked) {
            app.getString(R.string.error_screen_locked)
        }
        val policy =
            app.db.dao().policy()
                ?: workspaceError(app.getString(R.string.error_application_list_missing))
        val rules = RuleCodec.decode(policy.rules)
        PolicyValidator.validate(
                rules,
                installed().map { it.packageName }.toSet(),
                app.packageName,
                app.web.config.value.enabled,
            )
            ?.let { workspaceError(app.getString(it)) }
        app.permissions.requirePrepared(rules.map { it.packageName })
        checkWorkspace(Settings.canDrawOverlays(app)) {
            app.getString(R.string.error_overlay_required)
        }
        try {
            setPolicy(rules, false, policy.hideSystemBars)
            startProtection(activity)
            checkWorkspace(
                prefs
                    .edit()
                    .putBoolean("keepScreenOn", policy.keepScreenOn)
                    .putBoolean("hideSystemBars", policy.hideSystemBars)
                    .commit()
            )
            activity.window.keepAwake(policy.keepScreenOn)
            activity.window.systemBarsHidden(policy.hideSystemBars)
            overlay()
            checkWorkspace(lockState == ActivityManager.LOCK_TASK_MODE_LOCKED) {
                app.getString(R.string.error_protection_start)
            }
            app.db
                .dao()
                .put(
                    policy.copy(
                        appliedRevision = policy.revision,
                        appliedRules = policy.rules,
                        appliedKeepScreenOn = policy.keepScreenOn,
                        appliedHideSystemBars = policy.hideSystemBars,
                        enabled = true,
                        error = "",
                    )
                )
            app.audit("POLICY_APPLIED", "revision=${policy.revision}")
        } catch (e: Exception) {
            try {
                if (policy.enabled) {
                    setPolicy(
                        RuleCodec.decode(policy.appliedRules),
                        false,
                        policy.appliedHideSystemBars,
                    )
                    prefs
                        .edit()
                        .putBoolean("keepScreenOn", policy.appliedKeepScreenOn)
                        .putBoolean("hideSystemBars", policy.appliedHideSystemBars)
                        .commit()
                    activity.window.keepAwake(policy.appliedKeepScreenOn)
                    activity.window.systemBarsHidden(policy.appliedHideSystemBars)
                    overlay()
                } else {
                    prefs
                        .edit()
                        .putBoolean("keepScreenOn", false)
                        .putBoolean("hideSystemBars", false)
                        .commit()
                    activity.window.keepAwake(false)
                    activity.window.systemBarsHidden(false)
                    app.stopService(Intent(app, ExitOverlayService::class.java))
                    if (lockState != ActivityManager.LOCK_TASK_MODE_NONE) {
                        lockRootActivity.get()?.stopLockTask()
                        awaitLockState(ActivityManager.LOCK_TASK_MODE_NONE)
                    }
                    dpm.setLockTaskPackages(admin, emptyArray())
                    dpm.clearPackagePersistentPreferredActivities(admin, app.packageName)
                    restoreOtherLaunchers()
                    listOf(
                            UserManager.DISALLOW_SAFE_BOOT,
                            UserManager.DISALLOW_ADD_USER,
                            UserManager.DISALLOW_CONFIG_DATE_TIME,
                        )
                        .forEach { dpm.clearUserRestriction(admin, it) }
                    lockRootTaskId = null
                    lockRootActivity = WeakReference(null)
                }
            } catch (rollback: Exception) {
                e.addSuppressed(rollback)
                app.audit("POLICY_ROLLBACK_ERROR", rollback.javaClass.simpleName)
            }
            app.db.dao().put(policy.copy(error = e.messageForUser(app)))
            app.audit("POLICY_ERROR", e.javaClass.simpleName)
            throw e
        }
    }

    suspend fun restore(activity: Activity) = mutex.withLock {
        val policy = app.db.dao().policy() ?: return@withLock
        if (!policy.enabled || !owner) {
            prefs
                .edit()
                .putBoolean("keepScreenOn", false)
                .putBoolean("hideSystemBars", false)
                .commit()
            activity.window.keepAwake(false)
            activity.window.systemBarsHidden(false)
            app.stopService(Intent(app, ExitOverlayService::class.java))
            return@withLock
        }
        if (app.getSystemService(KeyguardManager::class.java).isKeyguardLocked) return@withLock
        try {
            val active = session
            val rules =
                when (active) {
                    WEB_SESSION -> emptyList()
                    null -> RuleCodec.decode(policy.appliedRules)
                    else -> listOf(AppRule(active, true))
                }
            setPolicy(rules, active != null, policy.appliedHideSystemBars)
            startProtection(activity)
            checkWorkspace(
                prefs
                    .edit()
                    .putBoolean("keepScreenOn", policy.appliedKeepScreenOn)
                    .putBoolean("hideSystemBars", policy.appliedHideSystemBars)
                    .commit()
            )
            activity.window.keepAwake(policy.appliedKeepScreenOn)
            activity.window.systemBarsHidden(policy.appliedHideSystemBars)
            overlay()
            if (active != null) {
                // Nowe uprawnienia po aktualizacji nie mogą otworzyć wyjścia z trwającej sesji.
                if (active != WEB_SESSION) app.permissions.requirePrepared(listOf(active))
                val target =
                    if (active == WEB_SESSION) Intent(app, WebActivity::class.java)
                    else app.packageManager.getLaunchIntentForPackage(active)
                checkWorkspace(target != null) {
                    app.getString(R.string.error_session_application)
                }
                checkWorkspace(Settings.canDrawOverlays(app)) {
                    app.getString(R.string.error_overlay_permission)
                }
                // Próba otwarcia pulpitu w pojedynczej sesji wraca do aktywnej aplikacji.
                activity.startActivity(target.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            }
            if (policy.error.startsWith("Odtwarzanie:")) app.db.dao().put(policy.copy(error = ""))
        } catch (e: Exception) {
            app.db.dao().put(policy.copy(error = "Odtwarzanie: ${e.messageForUser(app)}"))
            app.audit("RESTORE_ERROR", e.javaClass.simpleName)
        }
    }

    private suspend fun overlay(singleSession: Boolean = session != null) {
        ExitOverlayService.ready = CompletableDeferred()
        app.startForegroundService(
            Intent(app, ExitOverlayService::class.java).putExtra("singleSession", singleSession)
        )
        withTimeout(5000) { ExitOverlayService.ready.await() }
    }

    suspend fun prepareApp(activity: Activity, packageName: String) = mutex.withLock {
        app.requireAdmin()
        checkWorkspace(
            session == null &&
                lockState == ActivityManager.LOCK_TASK_MODE_NONE &&
                app.db.dao().policy()?.enabled != true
        ) {
            app.getString(R.string.error_preparation_requires_service)
        }
        checkWorkspace(installed().any { it.packageName == packageName }) {
            app.getString(R.string.error_application_unavailable)
        }
        val intent =
            app.packageManager.getLaunchIntentForPackage(packageName)
                ?: workspaceError(app.getString(R.string.error_application_unavailable))
        app.audit("APP_PREPARATION_LAUNCH", packageName)
        activity.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    suspend fun saveWeb(config: WebPageConfig) = mutex.withLock {
        app.requireAdmin()
        checkWorkspace(session == null) { app.getString(R.string.error_active_session) }
        if (!config.enabled) {
            val policy = app.db.dao().policy()
            checkWorkspace(
                policy?.enabled != true || RuleCodec.decode(policy.appliedRules).isNotEmpty()
            ) {
                app.getString(R.string.error_last_website_disabled)
            }
        }
        app.web.save(config)
        app.audit("WEB_CONFIG_SAVED")
    }

    suspend fun launchWeb(activity: Activity) = mutex.withLock {
        checkWorkspace(session == null) { app.getString(R.string.error_active_session) }
        val page = app.web.config.value
        checkWorkspace(page.enabled) {
            app.getString(R.string.error_website_disabled)
        }
        page.validationError()?.let { workspaceError(app.getString(it)) }
        val policy = app.db.dao().policy()
        checkWorkspace(owner && policy?.enabled == true) {
            app.getString(R.string.error_website_requires_protection)
        }
        checkWorkspace(Settings.canDrawOverlays(app)) {
            app.getString(R.string.error_floating_menu)
        }
        if (lockState != ActivityManager.LOCK_TASK_MODE_LOCKED) startProtection(activity)
        overlay(singleSession = page.singleSession)
        if (page.singleSession) {
            checkWorkspace(prefs.edit().putString("session", WEB_SESSION).commit())
            setPolicy(emptyList(), true, hideSystemBars)
        } else {
            // Powrót do pulpitu zachowuje zastosowaną listę dozwolonych aplikacji.
            setPolicy(RuleCodec.decode(checkNotNull(policy).appliedRules), false, hideSystemBars)
        }
        activity.startActivity(
            Intent(app, WebActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        )
        awaitLockState(ActivityManager.LOCK_TASK_MODE_LOCKED)
        app.audit("WEB_LAUNCH", "single=${page.singleSession}")
    }

    suspend fun launch(activity: Activity, packageName: String) = mutex.withLock {
        checkWorkspace(session == null) {
            app.getString(R.string.error_session_authorization)
        }
        val policy =
            app.db.dao().policy()
                ?: workspaceError(app.getString(R.string.error_configuration_missing))
        val rules = RuleCodec.decode(if (policy.enabled) policy.appliedRules else policy.rules)
        val rule =
            rules.singleOrNull { it.packageName == packageName }
                ?: workspaceError(app.getString(R.string.error_application_not_allowed))
        val intent =
            app.packageManager.getLaunchIntentForPackage(packageName)
                ?: workspaceError(app.getString(R.string.error_application_unavailable))
        if (!policy.enabled || !owner) {
            checkWorkspace(!rule.singleSession) {
                app.getString(R.string.error_single_session_requires_protection)
            }
            activity.startActivity(intent)
            return@withLock
        }
        app.permissions.requirePrepared(listOf(packageName))
        if (rule.singleSession) {
            checkWorkspace(Settings.canDrawOverlays(app)) {
                app.getString(R.string.error_floating_control)
            }
            overlay(singleSession = true)
            checkWorkspace(prefs.edit().putString("session", packageName).commit())
            setPolicy(listOf(rule), true, policy.appliedHideSystemBars)
        }
        if (lockState != ActivityManager.LOCK_TASK_MODE_LOCKED) {
            startProtection(activity)
        }
        // Korzeń stanowiska utrzymuje ochronę także podczas uruchamiania innych zadań.
        activity.startActivity(
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        )
        awaitLockState(ActivityManager.LOCK_TASK_MODE_LOCKED)
        app.audit("APP_LAUNCH", "$packageName single=${rule.singleSession}")
    }

    suspend fun endSession() = mutex.withLock {
        app.requireAdmin()
        val policy =
            app.db.dao().policy() ?: workspaceError(app.getString(R.string.error_policy_missing))
        val webSession = session == WEB_SESSION
        // Zawężenie listy usuwa obce zadanie. Ta metoda wymaga autoryzacji administratora.
        dpm.setLockTaskPackages(admin, arrayOf(app.packageName))
        setPolicy(RuleCodec.decode(policy.appliedRules), false, policy.appliedHideSystemBars)
        checkWorkspace(prefs.edit().remove("session").commit())
        if (webSession)
            app.getSystemService(ActivityManager::class.java)
                .appTasks
                .filter { it.taskInfo.baseActivity?.className == WebActivity::class.java.name }
                .forEach { it.finishAndRemoveTask() }
        overlay()
        app.audit("SESSION_END_AUTHORIZED")
    }

    suspend fun serviceExit() = mutex.withLock {
        app.requireAdmin()
        checkWorkspace(session == null)
        val policy = app.db.dao().policy() ?: return@withLock
        // Najpierw zapisujemy tryb serwisowy, żeby restart nie przywrócił ograniczeń.
        app.db.dao().put(policy.copy(enabled = false))
        checkWorkspace(
            prefs
                .edit()
                .putBoolean("keepScreenOn", false)
                .putBoolean("hideSystemBars", false)
                .commit()
        )
        lockRootActivity.get()?.window?.keepAwake(false)
        lockRootActivity.get()?.window?.systemBarsHidden(false)
        app.stopService(Intent(app, ExitOverlayService::class.java))
        if (owner) {
            if (lockState != ActivityManager.LOCK_TASK_MODE_NONE) {
                try {
                    lockRootActivity
                        .get()
                        ?.takeUnless { it.isFinishing || it.isDestroyed }
                        ?.stopLockTask()
                } catch (failure: RuntimeException) {
                    app.audit("LOCK_ROOT_EXIT_RETRY", failure.javaClass.simpleName)
                }
                // Po utracie procesu korzeń może być niedostępny; odebranie listy kończy ochronę.
                if (
                    withTimeoutOrNull(1500) {
                        while (lockState != ActivityManager.LOCK_TASK_MODE_NONE) delay(50)
                        true
                    } != true
                ) {
                    dpm.setLockTaskPackages(admin, emptyArray())
                    awaitLockState(ActivityManager.LOCK_TASK_MODE_NONE)
                }
            }
            dpm.setLockTaskPackages(admin, emptyArray())
            awaitLockState(ActivityManager.LOCK_TASK_MODE_NONE)
            lockRootTaskId = null
            lockRootActivity = WeakReference(null)
            dpm.clearPackagePersistentPreferredActivities(admin, app.packageName)
            restoreOtherLaunchers()
            listOf(
                    UserManager.DISALLOW_SAFE_BOOT,
                    UserManager.DISALLOW_ADD_USER,
                    UserManager.DISALLOW_CONFIG_DATE_TIME,
                )
                .forEach { dpm.clearUserRestriction(admin, it) }
        } else {
            checkWorkspace(lockState == ActivityManager.LOCK_TASK_MODE_NONE)
        }
        app.audit("SERVICE_EXIT")
    }
}
