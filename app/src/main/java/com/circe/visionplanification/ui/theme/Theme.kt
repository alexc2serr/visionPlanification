package com.circe.visionplanification.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = StitchDesignTokens.PrimaryAccent,
    secondary = StitchDesignTokens.SecondaryAccent,
    tertiary = StitchDesignTokens.SuccessGreen,
    background = StitchDesignTokens.SurfaceDark,
    surface = StitchDesignTokens.SurfaceGlass,
    onPrimary = StitchDesignTokens.SurfaceDark,
    onSecondary = StitchDesignTokens.TextPrimary,
    onBackground = StitchDesignTokens.TextPrimary,
    onSurface = StitchDesignTokens.TextPrimary
)

@Composable
fun VisionPlanificationTheme(
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = android.graphics.Color.TRANSPARENT
            window.navigationBarColor = android.graphics.Color.TRANSPARENT
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
