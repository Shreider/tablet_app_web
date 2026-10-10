package pl.adriantur.stanowisko

import android.view.Window
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager

fun Window.keepAwake(enabled: Boolean) {
    if (enabled) addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    else clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
}

fun Window.systemBarsHidden(hidden: Boolean) {
    insetsController?.let { controller ->
        controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_DEFAULT
        if (hidden) controller.hide(WindowInsets.Type.systemBars())
        else controller.show(WindowInsets.Type.systemBars())
    }
}
