package pl.adriantur.stanowisko

import android.Manifest
import android.app.admin.DevicePolicyManager
import android.content.pm.PackageManager
import android.content.pm.PermissionInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class AppPermission(
    val name: String,
    val label: String,
    val granted: Boolean,
    val policyState: Int = DevicePolicyManager.PERMISSION_GRANT_STATE_DEFAULT,
) {
    val prepared
        get() = granted || policyState == DevicePolicyManager.PERMISSION_GRANT_STATE_DENIED
}

// Zależności uprawnień wynikają z Androida i nie zależą od wybranej aplikacji.
object PermissionGrantPlan {
    fun validate(grants: Map<String, Boolean>): Int? {
        val coarse = Manifest.permission.ACCESS_COARSE_LOCATION
        val fine = Manifest.permission.ACCESS_FINE_LOCATION
        val background = Manifest.permission.ACCESS_BACKGROUND_LOCATION
        if (grants[fine] == true && coarse in grants && grants[coarse] != true)
            return R.string.error_precise_location
        if (grants[background] == true && grants[coarse] != true && grants[fine] != true)
            return R.string.error_background_location
        return null
    }

    fun ordered(grants: Map<String, Boolean>): List<Pair<String, Boolean>> =
        grants.entries
            .sortedWith(
                compareBy<Map.Entry<String, Boolean>> { if (it.value) 1 else 0 }
                    .thenBy {
                        val rank =
                            when (it.key) {
                                Manifest.permission.ACCESS_COARSE_LOCATION -> 0
                                Manifest.permission.ACCESS_FINE_LOCATION -> 1
                                Manifest.permission.ACCESS_BACKGROUND_LOCATION -> 3
                                else -> 2
                            }
                        if (it.value) rank else -rank
                    }
                    .thenBy { it.key }
            )
            .map { it.key to it.value }
}

class AppPermissionManager(private val app: WorkspaceApp) {
    fun list(packageName: String): List<AppPermission> {
        val manager = app.packageManager
        val info = manager.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS)
        return info.requestedPermissions
            .orEmpty()
            .mapNotNull { name ->
                // Aplikacja może deklarować uprawnienie producenta nieobecne na tym urządzeniu.
                val permission =
                    try {
                        manager.getPermissionInfo(name, 0)
                    } catch (_: PackageManager.NameNotFoundException) {
                        return@mapNotNull null
                    }
                if (
                    permission.protectionLevel and PermissionInfo.PROTECTION_MASK_BASE !=
                        PermissionInfo.PROTECTION_DANGEROUS
                )
                    null
                else {
                    val policyState =
                        if (app.engine.owner)
                            app.engine.dpm.getPermissionGrantState(
                                app.engine.admin,
                                packageName,
                                name,
                            )
                        else DevicePolicyManager.PERMISSION_GRANT_STATE_DEFAULT
                    AppPermission(
                        name,
                        permission.loadLabel(manager).toString(),
                        policyState != DevicePolicyManager.PERMISSION_GRANT_STATE_DENIED &&
                            manager.checkPermission(name, packageName) ==
                                PackageManager.PERMISSION_GRANTED,
                        policyState,
                    )
                }
            }
            .sortedBy { it.label }
    }

    suspend fun requirePrepared(packageNames: Collection<String>) =
        withContext(Dispatchers.IO) {
            val missing = packageNames.distinct().filter { pkg -> list(pkg).any { !it.prepared } }
            if (missing.isNotEmpty()) {
                val names =
                    missing.joinToString(", ") { pkg ->
                        app.packageManager
                            .getApplicationLabel(app.packageManager.getApplicationInfo(pkg, 0))
                            .toString()
                    }
                workspaceError(app.getString(R.string.permissions_prepare, names))
            }
        }

    suspend fun configure(packageName: String, grants: Map<String, Boolean>) =
        withContext(Dispatchers.IO) {
            app.requireAdmin()
            val engine = app.engine
            checkWorkspace(engine.owner) {
                app.getString(R.string.error_permissions_require_owner)
            }
            checkWorkspace(engine.session == null) {
                app.getString(R.string.error_active_session)
            }
            val available = list(packageName).associateBy { it.name }
            checkWorkspace(grants.keys.all { it in available }) {
                app.getString(R.string.error_permission_not_declared)
            }
            PermissionGrantPlan.validate(available.mapValues { it.value.granted } + grants)?.let {
                workspaceError(app.getString(it))
            }
            val before =
                grants.keys.associateWith {
                    engine.dpm.getPermissionGrantState(engine.admin, packageName, it)
                }
            val changed = mutableListOf<String>()
            try {
                for ((permission, granted) in PermissionGrantPlan.ordered(grants)) {
                    val state =
                        if (granted) DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                        else DevicePolicyManager.PERMISSION_GRANT_STATE_DENIED
                    checkWorkspace(
                        engine.dpm.setPermissionGrantState(
                            engine.admin,
                            packageName,
                            permission,
                            state,
                        )
                    ) {
                        app.getString(R.string.error_permission_change, permission)
                    }
                    changed += permission
                }
                val actual = list(packageName).associateBy { it.name }
                checkWorkspace(
                    grants.all { (name, granted) ->
                        actual.getValue(name).policyState ==
                            (if (granted) DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                            else DevicePolicyManager.PERMISSION_GRANT_STATE_DENIED) &&
                            actual.getValue(name).granted == granted
                    }
                ) {
                    app.getString(R.string.error_permissions_verification)
                }
            } catch (failure: Exception) {
                for (permission in changed.asReversed()) {
                    val effective =
                        if (available.getValue(permission).granted)
                            DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                        else DevicePolicyManager.PERMISSION_GRANT_STATE_DENIED
                    engine.dpm.setPermissionGrantState(
                        engine.admin,
                        packageName,
                        permission,
                        effective,
                    )
                    engine.dpm.setPermissionGrantState(
                        engine.admin,
                        packageName,
                        permission,
                        before.getValue(permission),
                    )
                }
                app.audit("APP_PERMISSION_ERROR", "$packageName ${failure.javaClass.simpleName}")
                throw failure
            }
            app.audit("APP_PERMISSIONS_CHANGED", packageName)
        }
}
