package pl.adriantur.stanowisko

import android.app.Activity
import android.app.ActivityManager
import android.app.role.RoleManager
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.view.WindowManager
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import androidx.core.graphics.drawable.toBitmap
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.*

@Composable
internal fun WorkspaceScreen(
    vm: WorkspaceViewModel,
    generation: Int,
    activity: Activity,
    permissionRequest: String?,
    consumePermissionRequest: () -> Unit,
) {
    val policy by vm.policy.collectAsStateWithLifecycle()
    val apps by vm.apps.collectAsStateWithLifecycle()
    val pendingPermissions by vm.pendingPermissions.collectAsStateWithLifecycle()
    val savedWeb by vm.app.web.config.collectAsStateWithLifecycle()
    val events by vm.events.collectAsStateWithLifecycle()
    val message by vm.message.collectAsStateWithLifecycle()
    val busy by vm.busy.collectAsStateWithLifecycle()
    var tick by remember { mutableIntStateOf(0) }
    val lifecycleOwner = LocalLifecycleOwner.current
    LaunchedEffect(lifecycleOwner) {
        lifecycleOwner.lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            while (true) {
                delay(1000)
                tick++
            }
        }
    }
    val app = vm.app
    val admin = remember(generation, tick) { app.authorized() }
    val session = remember(generation, tick) { app.engine.session }
    var pin by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var configured by remember(generation) { mutableStateOf(app.pin.configured) }
    var draft by
        remember(policy?.revision) {
            mutableStateOf(policy?.let { RuleCodec.decode(it.rules) } ?: emptyList())
        }
    var keepScreenOn by remember(policy?.revision) { mutableStateOf(policy?.keepScreenOn ?: false) }
    var hideSystemBars by
        remember(policy?.revision) { mutableStateOf(policy?.hideSystemBars ?: true) }
    DisposableEffect(policy?.enabled, policy?.appliedKeepScreenOn, policy?.appliedHideSystemBars) {
        activity.window.keepAwake(policy?.enabled == true && policy?.appliedKeepScreenOn == true)
        activity.window.systemBarsHidden(
            policy?.enabled == true && policy?.appliedHideSystemBars == true
        )
        onDispose {
            activity.window.keepAwake(false)
            activity.window.systemBarsHidden(false)
        }
    }
    var showLog by remember { mutableStateOf(false) }
    var permissionApp by remember { mutableStateOf<InstalledApp?>(null) }
    var resumeAfterPermissions by remember { mutableStateOf(false) }
    LaunchedEffect(permissionRequest, admin, apps, session) {
        if (permissionRequest != null && admin && session == null) {
            apps
                .firstOrNull { it.packageName == permissionRequest }
                ?.let {
                    permissionApp = it
                    resumeAfterPermissions = true
                    consumePermissionRequest()
                }
        }
    }
    permissionApp
        ?.takeIf { admin }
        ?.let { selectedApp ->
            val permissions =
                remember(selectedApp.packageName) { app.permissions.list(selectedApp.packageName) }
            var grants by
                remember(selectedApp.packageName) {
                    mutableStateOf(permissions.associate { it.name to it.granted })
                }
            AlertDialog(
                onDismissRequest = { permissionApp = null },
                title = {
                    Text(app.getString(R.string.permissions_for_application, selectedApp.label))
                },
                text = {
                    Column(Modifier.heightIn(max = 480.dp).verticalScroll(rememberScrollState())) {
                        Text(app.getString(R.string.permission_selection_help))
                        if (permissions.isEmpty())
                            Text(app.getString(R.string.permissions_not_required))
                        permissions.forEach { permission ->
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(
                                    grants[permission.name] == true,
                                    { grants = grants + (permission.name to it) },
                                )
                                Text(permission.label)
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(
                        enabled = !busy,
                        onClick = {
                            vm.run {
                                app.permissions.configure(selectedApp.packageName, grants)
                                vm.refreshPermissions(selectedApp.packageName)
                                permissionApp = null
                                vm.notify(app.getString(R.string.permissions_saved))
                                if (resumeAfterPermissions && policy?.enabled == true) {
                                    resumeAfterPermissions = false
                                    app.adminUntil = 0
                                    app.engine.launch(activity, selectedApp.packageName)
                                }
                            }
                        },
                    ) {
                        Text(app.getString(R.string.save_permissions))
                    }
                },
                dismissButton = {
                    Column {
                        if (
                            policy?.enabled != true &&
                                app.engine.lockState == ActivityManager.LOCK_TASK_MODE_NONE
                        ) {
                            TextButton(
                                enabled = !busy,
                                onClick = {
                                    vm.run {
                                        app.engine.prepareApp(activity, selectedApp.packageName)
                                        permissionApp = null
                                    }
                                },
                            ) {
                                Text(app.getString(R.string.prepare_application))
                            }
                        } else
                            Text(
                                app.getString(R.string.application_preparation_help),
                                style = MaterialTheme.typography.bodySmall,
                            )
                        TextButton(onClick = { permissionApp = null }) {
                            Text(app.getString(R.string.cancel))
                        }
                    }
                },
            )
        }
    DisposableEffect(admin, configured) {
        if (admin || !configured) activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        else activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        onDispose {}
    }
    BackHandler(
        enabled = session != null || app.engine.lockState == ActivityManager.LOCK_TASK_MODE_LOCKED
    ) {
        app.adminUntil = 0
        tick++
    }
    if (session == null && configured && !admin) {
        WorkspaceLauncher(
            rules =
                policy?.let { RuleCodec.decode(if (it.enabled) it.appliedRules else it.rules) }
                    ?: emptyList(),
            apps = apps,
            protected =
                app.engine.owner &&
                    policy?.enabled == true &&
                    app.engine.lockState == ActivityManager.LOCK_TASK_MODE_LOCKED,
            busy = busy,
            message = message,
            web = savedWeb,
            launchWeb = { vm.run { app.engine.launchWeb(activity) } },
            launch = { pkg ->
                vm.run {
                    val pending =
                        policy?.enabled == true &&
                            app.engine.owner &&
                            withContext(Dispatchers.IO) {
                                app.permissions.list(pkg).any { !it.prepared }
                            }
                    if (pending)
                        activity.startActivity(
                            Intent(activity, AuthActivity::class.java)
                                .putExtra(AuthActivity.EXTRA_PERMISSION_PACKAGE, pkg)
                        )
                    else app.engine.launch(activity, pkg)
                }
            },
            admin = { activity.startActivity(Intent(activity, AuthActivity::class.java)) },
        )
        return
    }
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
        LazyColumn(
            Modifier.widthIn(max = 840.dp)
                .fillMaxSize()
                .safeDrawingPadding()
                .imePadding()
                .padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Spacer(Modifier.height(20.dp))
                Text(
                    app.getString(R.string.administrator_brand),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary,
                )
                Text(
                    if (session != null) app.getString(R.string.locked_session)
                    else if (admin || !configured) app.getString(R.string.workspace_settings)
                    else app.getString(R.string.workspace_desktop),
                    style = MaterialTheme.typography.headlineLarge,
                )
                Text(
                    app.getString(R.string.workspace_description),
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            item {
                Card(Modifier.fillMaxWidth()) {
                    Column(
                        Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Text(
                            if (app.engine.owner) app.getString(R.string.device_management_active)
                            else app.getString(R.string.protection_inactive),
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Text(
                            app.getString(
                                R.string.status_home,
                                app.getString(
                                    if (app.engine.home) R.string.answer_yes else R.string.answer_no
                                ),
                            )
                        )
                        Text(
                            app.getString(
                                R.string.status_lock,
                                lockStateLabel(app, app.engine.lockState),
                            )
                        )
                        Text(
                            app.getString(
                                R.string.status_policy,
                                policy?.revision ?: 0,
                                policy?.appliedRevision?.takeIf { it >= 0 }?.toString()
                                    ?: app.getString(R.string.value_missing),
                                app.getString(
                                    if (policy?.enabled == true) R.string.policy_active
                                    else R.string.policy_inactive
                                ),
                            )
                        )
                        policy
                            ?.error
                            ?.takeIf { it.isNotEmpty() }
                            ?.let {
                                Text(
                                    app.getString(R.string.error_saved_policy),
                                    color = MaterialTheme.colorScheme.error,
                                )
                            }
                    }
                }
            }
            message?.let { notice -> item { WorkspaceNoticeText(notice) } }
            if (busy) item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            if (session != null) {
                item {
                    Text(
                        if (session == PolicyEngine.WEB_SESSION)
                            app.getString(R.string.active_website, savedWeb.title)
                        else app.getString(R.string.active_application, session)
                    )
                }
                item {
                    Button(
                        onClick = {
                            activity.startActivity(Intent(activity, AuthActivity::class.java))
                        }
                    ) {
                        Text(app.getString(R.string.authorize_desktop_return))
                    }
                }
            } else if (!configured) {
                item {
                    Text(
                        app.getString(R.string.setup_pin_title),
                        style = MaterialTheme.typography.titleLarge,
                    )
                    Text(app.getString(R.string.pin_setup_help))
                }
                item {
                    AdministratorPinField(pin, { pin = it })
                    AdministratorPinField(
                        confirm,
                        { confirm = it },
                        app.getString(R.string.repeat_pin),
                    )
                }
                item {
                    Button(
                        enabled = !busy,
                        onClick = {
                            val value = pin
                            val repeated = confirm
                            pin = ""
                            confirm = ""
                            vm.run {
                                checkWorkspace(value == repeated) {
                                    app.getString(R.string.error_pin_mismatch)
                                }
                                app.pin.set(value)
                                configured = true
                                app.adminUntil = android.os.SystemClock.elapsedRealtime() + 120_000
                                tick++
                                app.audit("PIN_CREATED")
                            }
                        },
                    ) {
                        Text(app.getString(R.string.set_administrator_pin))
                    }
                }
            } else if (admin) {
                item {
                    Text(
                        app.getString(R.string.setup_device_title),
                        style = MaterialTheme.typography.titleLarge,
                    )
                }
                item {
                    Text(
                        app.getString(
                            R.string.status_overlay,
                            app.getString(
                                if (Settings.canDrawOverlays(activity)) R.string.overlay_available
                                else R.string.overlay_permission_required
                            ),
                        )
                    )
                    OutlinedButton(
                        onClick = {
                            activity.startActivity(
                                Intent(
                                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                    Uri.parse("package:${activity.packageName}"),
                                )
                            )
                        },
                        enabled = policy?.enabled != true,
                    ) {
                        Text(app.getString(R.string.allow_floating_menu))
                    }
                    if (!app.engine.home && !app.engine.owner)
                        OutlinedButton(
                            onClick = {
                                activity.startActivity(
                                    activity
                                        .getSystemService(RoleManager::class.java)
                                        .createRequestRoleIntent(RoleManager.ROLE_HOME)
                                )
                            }
                        ) {
                            Text(app.getString(R.string.set_default_desktop))
                        }
                    if (app.systemMenu.supported) {
                        Text(app.getString(R.string.lenovo_menu_help))
                    }
                    Text(
                        if (app.engine.owner) app.getString(R.string.device_prepared_help)
                        else app.getString(R.string.device_preparation_help)
                    )
                }
                item {
                    WebsiteSettings(savedWeb, busy) { page, notice ->
                        vm.run {
                            app.engine.saveWeb(page)
                            vm.notify(notice)
                        }
                    }
                }
                item {
                    Text(
                        app.getString(R.string.setup_applications_title),
                        style = MaterialTheme.typography.titleLarge,
                    )
                }
                if (draft.any { (pendingPermissions[it.packageName] ?: 0) > 0 })
                    item {
                        Text(
                            app.getString(R.string.permission_attention_help),
                            color = PermissionAttentionColor,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                items(apps, key = { it.packageName }) { installed ->
                    val selected = draft.find { it.packageName == installed.packageName }
                    val pendingCount = pendingPermissions[installed.packageName] ?: 0
                    val needsPermissions = selected != null && pendingCount > 0
                    val unreadable =
                        selected != null &&
                            pendingPermissions.containsKey(installed.packageName) &&
                            pendingPermissions[installed.packageName] == null
                    Card(
                        Modifier.fillMaxWidth()
                            .padding(4.dp)
                            .permissionAttention(needsPermissions)
                            .semantics {
                                if (needsPermissions)
                                    stateDescription =
                                        app.getString(R.string.permissions_pending, pendingCount)
                            },
                        border =
                            if (needsPermissions)
                                androidx.compose.foundation.BorderStroke(
                                    2.dp,
                                    PermissionAttentionColor,
                                )
                            else null,
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(
                                    checked = selected != null,
                                    onCheckedChange = { checked ->
                                        draft =
                                            draft.filterNot {
                                                it.packageName == installed.packageName
                                            } +
                                                if (checked)
                                                    listOf(AppRule(installed.packageName, false))
                                                else emptyList()
                                    },
                                )
                                Image(
                                    remember(installed.packageName) {
                                        installed.icon.toBitmap(64, 64).asImageBitmap()
                                    },
                                    null,
                                    Modifier.size(40.dp),
                                )
                                Column(Modifier.padding(start = 12.dp).weight(1f)) {
                                    Text(
                                        installed.label,
                                        style = MaterialTheme.typography.titleMedium,
                                    )
                                    Text(
                                        installed.packageName,
                                        style = MaterialTheme.typography.bodySmall,
                                    )
                                    if (needsPermissions)
                                        Text(
                                            app.getString(
                                                R.string.permissions_attention,
                                                pendingCount,
                                            ),
                                            color = PermissionAttentionColor,
                                            style = MaterialTheme.typography.labelLarge,
                                        )
                                    if (unreadable)
                                        Text(
                                            app.getString(R.string.error_permissions_read),
                                            color = Color(0xFFFFCE83),
                                            style = MaterialTheme.typography.bodySmall,
                                        )
                                }
                            }
                            if (selected != null)
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Switch(
                                        selected.singleSession,
                                        { single ->
                                            draft = draft.map {
                                                if (it.packageName == installed.packageName)
                                                    it.copy(singleSession = single)
                                                else it
                                            }
                                        },
                                    )
                                    Text(
                                        if (selected.singleSession)
                                            app.getString(R.string.mode_single)
                                        else app.getString(R.string.mode_multiple),
                                        Modifier.padding(start = 8.dp),
                                    )
                                }
                            if (selected != null && app.engine.owner)
                                OutlinedButton(
                                    enabled = !busy,
                                    onClick = {
                                        resumeAfterPermissions = false
                                        permissionApp = installed
                                    },
                                ) {
                                    Text(app.getString(R.string.application_permissions))
                                }
                        }
                    }
                }
                item {
                    Row(
                        modifier =
                            Modifier.fillMaxWidth()
                                .toggleable(
                                    value = keepScreenOn,
                                    enabled = !busy,
                                    role = Role.Switch,
                                    onValueChange = { keepScreenOn = it },
                                )
                                .semantics(mergeDescendants = true) {
                                    contentDescription = app.getString(R.string.keep_screen_awake)
                                },
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Switch(keepScreenOn, onCheckedChange = null, enabled = !busy)
                        Text(
                            app.getString(R.string.keep_screen_awake),
                            Modifier.padding(start = 8.dp),
                        )
                    }
                    Text(
                        app.getString(R.string.keep_screen_awake_help),
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                item {
                    Row(
                        modifier =
                            Modifier.fillMaxWidth()
                                .toggleable(
                                    value = hideSystemBars,
                                    enabled = !busy,
                                    role = Role.Switch,
                                    onValueChange = { hideSystemBars = it },
                                )
                                .semantics(mergeDescendants = true) {
                                    contentDescription = app.getString(R.string.hide_system_bars)
                                },
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Switch(hideSystemBars, onCheckedChange = null, enabled = !busy)
                        Text(
                            app.getString(R.string.hide_system_bars),
                            Modifier.padding(start = 8.dp),
                        )
                    }
                    Text(
                        app.getString(R.string.hide_system_bars_help),
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                item {
                    Button(
                        enabled = !busy,
                        onClick = {
                            vm.run {
                                app.engine.save(draft, keepScreenOn, hideSystemBars)
                                vm.notify(
                                    app.getString(R.string.configuration_saved),
                                    NoticeKind.CONFIGURATION,
                                )
                            }
                        },
                    ) {
                        Text(app.getString(R.string.save_configuration))
                    }
                }
                item {
                    Button(
                        enabled = !busy && app.engine.owner && policy != null,
                        onClick = {
                            vm.run {
                                app.engine.apply(activity)
                                vm.notify(app.getString(R.string.policy_applied))
                                app.adminUntil = 0
                                tick++
                            }
                        },
                    ) {
                        Text(app.getString(R.string.apply_saved_policy))
                    }
                }
                item {
                    Text(
                        app.getString(R.string.change_pin_title),
                        style = MaterialTheme.typography.titleLarge,
                    )
                    AdministratorPinField(
                        pin,
                        { pin = it },
                        app.getString(R.string.new_administrator_pin),
                    )
                    AdministratorPinField(
                        confirm,
                        { confirm = it },
                        app.getString(R.string.repeat_new_pin),
                    )
                    OutlinedButton(
                        enabled = !busy,
                        onClick = {
                            val value = pin
                            val repeated = confirm
                            pin = ""
                            confirm = ""
                            vm.run {
                                app.requireAdmin()
                                checkWorkspace(value == repeated) {
                                    app.getString(R.string.error_pin_mismatch)
                                }
                                app.pin.set(value, true)
                                app.audit("PIN_CHANGED")
                                vm.notify(app.getString(R.string.administrator_pin_changed))
                            }
                        },
                    ) {
                        Text(app.getString(R.string.change_administrator_pin))
                    }
                }
                item {
                    if (app.engine.owner && policy != null)
                        OutlinedButton(
                            enabled = !busy,
                            onClick = {
                                vm.run {
                                    app.engine.serviceExit()
                                    vm.notify(app.getString(R.string.service_mode_enabled))
                                }
                            },
                        ) {
                            Text(app.getString(R.string.service_exit))
                        }
                }
                item {
                    if (app.engine.owner)
                        OutlinedButton(
                            onClick = {
                                vm.run {
                                    app.requireAdmin()
                                    app.audit("ADMIN_REBOOT")
                                    app.engine.dpm.reboot(app.engine.admin)
                                }
                            }
                        ) {
                            Text(app.getString(R.string.restart_device))
                        }
                }
                item {
                    TextButton(onClick = { showLog = !showLog }) {
                        Text(app.getString(R.string.event_log))
                    }
                }
                if (showLog)
                    items(events) {
                        Text(it.displayText(app), style = MaterialTheme.typography.bodySmall)
                    }
                item {
                    Button(
                        onClick = {
                            app.adminUntil = 0
                            tick++
                        }
                    ) {
                        Text(app.getString(R.string.close_administrator_panel))
                    }
                }
            }
            item { Spacer(Modifier.height(24.dp)) }
        }
    }
}
