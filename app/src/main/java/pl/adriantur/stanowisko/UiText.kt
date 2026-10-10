package pl.adriantur.stanowisko

import android.app.ActivityManager
import android.content.Context
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

internal fun lockStateLabel(context: Context, state: Int): String =
    context.getString(
        when (state) {
            ActivityManager.LOCK_TASK_MODE_LOCKED -> R.string.lock_state_protected
            ActivityManager.LOCK_TASK_MODE_PINNED -> R.string.lock_state_pinned
            else -> R.string.lock_state_inactive
        }
    )

internal fun AuditEvent.displayText(context: Context): String {
    val label =
        context.getString(
            when (kind) {
                "POLICY_SAVED" -> R.string.event_policy_saved
                "POLICY_APPLIED" -> R.string.event_policy_applied
                "POLICY_ROLLBACK_ERROR" -> R.string.event_policy_rollback_error
                "POLICY_ERROR" -> R.string.event_policy_error
                "RESTORE_ERROR" -> R.string.event_restore_error
                "APP_PREPARATION_LAUNCH" -> R.string.event_app_preparation
                "APP_LAUNCH" -> R.string.event_app_launch
                "WEB_CONFIG_SAVED" -> R.string.event_website_saved
                "WEB_LAUNCH",
                "WEB_SESSION_START" -> R.string.event_website_launch
                "SESSION_END_AUTHORIZED" -> R.string.event_session_end
                "LOCK_ROOT_EXIT_RETRY" -> R.string.event_exit_retry
                "SERVICE_EXIT" -> R.string.event_service_exit
                "APP_PERMISSION_ERROR" -> R.string.event_permissions_error
                "APP_PERMISSIONS_CHANGED" -> R.string.event_permissions_saved
                "APP_PERMISSION_READ_ERROR" -> R.string.event_permissions_read_error
                "OPERATION_ERROR" -> R.string.event_operation_error
                "PIN_CREATED" -> R.string.event_pin_created
                "PIN_CHANGED" -> R.string.event_pin_changed
                "ADMIN_REBOOT" -> R.string.event_restart
                "AUTH_CANCEL" -> R.string.event_auth_cancel
                "AUTH_SUCCESS" -> R.string.event_auth_success
                "AUTH_FAILURE" -> R.string.event_auth_failure
                "AUTH_ERROR" -> R.string.event_auth_error
                "LOCK_TASK_ENTER" -> R.string.event_protection_started
                "LOCK_TASK_EXIT" -> R.string.event_protection_ended
                "BOOT_RESTORE_REQUEST" -> R.string.event_restore_requested
                "BOOT_ERROR" -> R.string.event_boot_error
                else -> R.string.event_system
            }
        )
    val description =
        when (kind) {
            "POLICY_APPLIED" ->
                detail
                    .removePrefix("revision=")
                    .toLongOrNull()
                    ?.let {
                        context.getString(R.string.event_revision, it)
                    }
                    .orEmpty()
            "WEB_LAUNCH" ->
                context.getString(
                    if (detail == "single=true") R.string.mode_single else R.string.mode_multiple
                )
            "APP_LAUNCH" ->
                context.getString(
                    R.string.event_application_mode,
                    detail.substringBefore(" single="),
                    context.getString(
                        if (detail.substringAfter(" single=", "false") == "true")
                            R.string.mode_single
                        else R.string.mode_multiple
                    ),
                )
            "APP_PREPARATION_LAUNCH",
            "APP_PERMISSIONS_CHANGED",
            "APP_PERMISSION_READ_ERROR",
            "LOCK_TASK_ENTER" -> detail
            else -> ""
        }
    val formatter =
        DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss", Locale.forLanguageTag("pl-PL"))
    val timestamp = formatter.format(Instant.ofEpochMilli(time).atZone(ZoneId.systemDefault()))
    return if (description.isBlank()) "$timestamp · $label"
    else "$timestamp · $label · $description"
}
