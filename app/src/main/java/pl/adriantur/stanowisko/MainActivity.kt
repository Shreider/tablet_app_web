package pl.adriantur.stanowisko

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.*

class MainActivity : ComponentActivity() {
    private val vm by viewModels<WorkspaceViewModel>()
    private var generation by mutableIntStateOf(0)
    private var initialized by mutableStateOf(false)
    private var initializationFailed by mutableStateOf(false)
    private var permissionRequest by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        permissionRequest = intent.getStringExtra(AuthActivity.EXTRA_PERMISSION_PACKAGE)
        vm.app.engine.attach(this)
        val barColor = android.graphics.Color.rgb(5, 14, 23)
        enableEdgeToEdge(SystemBarStyle.dark(barColor), SystemBarStyle.dark(barColor))
        window.isNavigationBarContrastEnforced = false
        setContent {
            WorkspaceTheme {
                WorkspaceBackdrop {
                    if (initialized)
                        WorkspaceScreen(vm, generation, this@MainActivity, permissionRequest) {
                            permissionRequest = null
                            intent.removeExtra(AuthActivity.EXTRA_PERMISSION_PACKAGE)
                        }
                    else
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            if (initializationFailed)
                                Text(getString(R.string.error_application_start))
                            else CircularProgressIndicator()
                        }
                }
            }
        }
        lifecycleScope.launch {
            try {
                vm.app.initialization.await()
                initialized = true
            } catch (e: CancellationException) {
                throw e
            } catch (_: Exception) {
                initializationFailed = true
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        permissionRequest = intent.getStringExtra(AuthActivity.EXTRA_PERMISSION_PACKAGE)
    }

    override fun onResume() {
        super.onResume()
        generation++
        vm.refresh()
        lifecycleScope.launch {
            try {
                vm.app.initialization.await()
            } catch (e: CancellationException) {
                throw e
            } catch (_: Exception) {
                return@launch
            }
            vm.app.engine.restore(this@MainActivity)
            vm.refresh()
            generation++
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) window.systemBarsHidden(vm.app.engine.hideSystemBars)
    }
}
