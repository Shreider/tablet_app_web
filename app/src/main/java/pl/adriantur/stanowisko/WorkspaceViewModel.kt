package pl.adriantur.stanowisko

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

class WorkspaceViewModel(application: Application) : AndroidViewModel(application) {
    val app = application as WorkspaceApp
    val policy =
        app.db.dao().observe().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)
    val events =
        app.db
            .dao()
            .events()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val apps = MutableStateFlow<List<InstalledApp>>(emptyList())
    val pendingPermissions = MutableStateFlow<Map<String, Int?>>(emptyMap())
    private val currentNotice = MutableStateFlow<WorkspaceNotice?>(null)
    val message = currentNotice.asStateFlow()
    val busy = MutableStateFlow(false)
    private var refreshJob: Job? = null
    private var noticeJob: Job? = null

    fun notify(text: String, kind: NoticeKind = NoticeKind.INFORMATION) {
        noticeJob?.cancel()
        val notice = WorkspaceNotice(text, kind)
        currentNotice.value = notice
        noticeJob =
            if (notice.expires)
                viewModelScope.launch {
                    delay(4000)
                    currentNotice.compareAndSet(notice, null)
                }
            else null
    }

    fun refresh() {
        refreshJob?.cancel()
        refreshJob = viewModelScope.launch {
            try {
                val installed = withContext(Dispatchers.IO) { app.engine.installed() }
                apps.value = installed
                val counts =
                    withContext(Dispatchers.IO) {
                        installed.associate { installedApp ->
                            val count =
                                try {
                                    app.permissions.list(installedApp.packageName).count {
                                        !it.prepared
                                    }
                                } catch (e: CancellationException) {
                                    throw e
                                } catch (_: Exception) {
                                    null
                                }
                            installedApp.packageName to count
                        }
                    }
                pendingPermissions.value = counts
                if (counts.values.any { it == null })
                    app.audit(
                        "APP_PERMISSION_READ_ERROR",
                        counts.filterValues { it == null }.keys.joinToString(","),
                    )
            } catch (e: CancellationException) {
                throw e
            } catch (_: Exception) {
                notify(
                    app.getString(R.string.error_application_list_read),
                    NoticeKind.ERROR,
                )
            }
        }
    }

    suspend fun refreshPermissions(packageName: String) {
        refreshJob?.cancel()
        val count =
            withContext(Dispatchers.IO) { app.permissions.list(packageName).count { !it.prepared } }
        pendingPermissions.update { it + (packageName to count) }
    }

    fun run(action: suspend () -> Unit) {
        if (busy.value) return
        viewModelScope.launch {
            busy.value = true
            noticeJob?.cancel()
            currentNotice.value = null
            try {
                action()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                notify(e.messageForUser(app), NoticeKind.ERROR)
                app.audit("OPERATION_ERROR", e.javaClass.simpleName)
            } finally {
                busy.value = false
            }
        }
    }
}
