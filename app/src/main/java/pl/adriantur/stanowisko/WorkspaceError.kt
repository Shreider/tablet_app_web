package pl.adriantur.stanowisko

import android.content.Context
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.contract

internal class WorkspaceException(message: String) : IllegalStateException(message)

@OptIn(ExperimentalContracts::class)
internal inline fun checkWorkspace(condition: Boolean, message: () -> String = { "" }) {
    contract { returns() implies condition }
    if (!condition) throw WorkspaceException(message())
}

internal fun workspaceError(message: String): Nothing = throw WorkspaceException(message)

internal fun Throwable.messageForUser(context: Context): String =
    if (this is WorkspaceException && !message.isNullOrBlank()) message!!
    else context.getString(R.string.error_operation)
