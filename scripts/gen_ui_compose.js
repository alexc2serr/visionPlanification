const fs = require('fs');
const path = require('path');

function writeFile(relativePath, content) {
    const fullPath = path.resolve(__dirname, '..', relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    const stats = fs.statSync(fullPath);
    console.log(`[UI/COMPOSE OK] ${relativePath} (${stats.size} bytes)`);
}

// 1. ui/theme/Color.kt
writeFile('app/src/main/java/com/circe/visionplanification/ui/theme/Color.kt', `package com.circe.visionplanification.ui.theme

import androidx.compose.ui.graphics.Color

val Purple80 = Color(0xFFD0BCFF)
val PurpleGrey80 = Color(0xFFCCC2DC)
val Pink80 = Color(0xFFEFB8C8)

val Purple40 = Color(0xFF6650a4)
val PurpleGrey40 = Color(0xFF625b71)
val Pink40 = Color(0xFF7D5260)
`);

// 2. ui/theme/Type.kt
writeFile('app/src/main/java/com/circe/visionplanification/ui/theme/Type.kt', `package com.circe.visionplanification.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Typography = Typography(
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        lineHeight = 28.sp,
        letterSpacing = 0.sp
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.SemiBold,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    )
)
`);

// 3. ui/theme/Theme.kt
writeFile('app/src/main/java/com/circe/visionplanification/ui/theme/Theme.kt', `package com.circe.visionplanification.ui.theme

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
`);

// 4. ui/components/AROverlayCanvas.kt
writeFile('app/src/main/java/com/circe/visionplanification/ui/components/AROverlayCanvas.kt', `package com.circe.visionplanification.ui.components

import android.graphics.Paint
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import com.circe.visionplanification.domain.model.InferenceResult
import com.circe.visionplanification.ui.theme.StitchDesignTokens
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun AROverlayCanvas(
    inferenceResult: InferenceResult,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier.fillMaxSize()) {
        val canvasWidth = size.width
        val canvasHeight = size.height

        inferenceResult.maskBitmap?.let { mask ->
            drawImage(
                image = mask.asImageBitmap(),
                srcOffset = IntOffset.Zero,
                srcSize = IntSize(mask.width, mask.height),
                dstOffset = IntOffset.Zero,
                dstSize = IntSize(canvasWidth.toInt(), canvasHeight.toInt()),
                alpha = 0.65f
            )
        }

        for (guidance in inferenceResult.guidanceList) {
            val origLeft = guidance.originalBounds.left * canvasWidth
            val origTop = guidance.originalBounds.top * canvasHeight
            val origWidth = guidance.originalBounds.width() * canvasWidth
            val origHeight = guidance.originalBounds.height() * canvasHeight

            val targetLeft = guidance.targetBounds.left * canvasWidth
            val targetTop = guidance.targetBounds.top * canvasHeight
            val targetWidth = guidance.targetBounds.width() * canvasWidth
            val targetHeight = guidance.targetBounds.height() * canvasHeight

            drawRect(
                color = StitchDesignTokens.WarningAmber.copy(alpha = 0.7f),
                topLeft = Offset(origLeft, origTop),
                size = Size(origWidth, origHeight),
                style = Stroke(width = 4f)
            )

            drawRect(
                color = StitchDesignTokens.PrimaryAccent,
                topLeft = Offset(targetLeft, targetTop),
                size = Size(targetWidth, targetHeight),
                style = Stroke(width = 6f)
            )

            val startCenter = Offset(origLeft + origWidth / 2f, origTop + origHeight / 2f)
            val endCenter = Offset(targetLeft + targetWidth / 2f, targetTop + targetHeight / 2f)

            drawLine(
                color = StitchDesignTokens.PrimaryAccent,
                start = startCenter,
                end = endCenter,
                strokeWidth = 5f
            )

            val angle = atan2(endCenter.y - startCenter.y, endCenter.x - startCenter.x)
            val arrowLength = 28f
            val arrowAngle = Math.PI / 6.0

            val p1 = Offset(
                (endCenter.x - arrowLength * cos(angle - arrowAngle)).toFloat(),
                (endCenter.y - arrowLength * sin(angle - arrowAngle)).toFloat()
            )
            val p2 = Offset(
                (endCenter.x - arrowLength * cos(angle + arrowAngle)).toFloat(),
                (endCenter.y - arrowLength * sin(angle + arrowAngle)).toFloat()
            )

            drawLine(color = StitchDesignTokens.PrimaryAccent, start = endCenter, end = p1, strokeWidth = 5f)
            drawLine(color = StitchDesignTokens.PrimaryAccent, start = endCenter, end = p2, strokeWidth = 5f)

            drawContext.canvas.nativeCanvas.apply {
                val textPaint = Paint().apply {
                    color = android.graphics.Color.WHITE
                    textSize = 34f
                    isFakeBoldText = true
                    setShadowLayer(8f, 0f, 0f, android.graphics.Color.BLACK)
                }
                drawText(
                    "✨ \${guidance.label} (\${(guidance.confidence * 100).toInt()}%)",
                    targetLeft + 12f,
                    targetTop - 16f,
                    textPaint
                )
            }
        }
    }
}
`);

// 5. ui/components/TelemetryBadge.kt
writeFile('app/src/main/java/com/circe/visionplanification/ui/components/TelemetryBadge.kt', `package com.circe.visionplanification.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.circe.visionplanification.core.telemetry.InferenceDelegateType
import com.circe.visionplanification.core.telemetry.TelemetrySnapshot
import com.circe.visionplanification.ui.theme.StitchDesignTokens

@Composable
fun TelemetryBadge(
    telemetry: TelemetrySnapshot,
    modifier: Modifier = Modifier
) {
    val fpsColor = when {
        telemetry.currentFps >= 27.0 -> StitchDesignTokens.SuccessGreen
        telemetry.currentFps >= 20.0 -> StitchDesignTokens.WarningAmber
        else -> StitchDesignTokens.RecordRed
    }

    val delegateLabel = when (telemetry.delegate) {
        InferenceDelegateType.GPU -> "GPU ⚡"
        InferenceDelegateType.NNAPI -> "NNAPI 🧠"
        InferenceDelegateType.CPU_MULTITHREAD -> "CPU 💻"
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(StitchDesignTokens.SurfaceGlass)
            .border(
                width = StitchDesignTokens.GlassBorderWidth,
                color = StitchDesignTokens.GlassBorderColor,
                shape = RoundedCornerShape(14.dp)
            )
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "\${telemetry.currentFps}",
                    color = fpsColor,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = " FPS",
                    color = StitchDesignTokens.TextSecondary,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            Text(text = "•", color = Color(0x40FFFFFF), fontSize = 12.sp)

            Column {
                Text(
                    text = "\${telemetry.inferenceMs} ms",
                    color = StitchDesignTokens.PrimaryAccent,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "inf (\${telemetry.totalLatencyMs}ms total)",
                    color = StitchDesignTokens.TextSecondary,
                    fontSize = 9.sp
                )
            }

            Text(text = "•", color = Color(0x40FFFFFF), fontSize = 12.sp)

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(Color(0x3300F0FF))
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = delegateLabel,
                    color = StitchDesignTokens.PrimaryAccent,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}
`);

// 6. ui/components/RecordingIndicator.kt
writeFile('app/src/main/java/com/circe/visionplanification/ui/components/RecordingIndicator.kt', `package com.circe.visionplanification.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.circe.visionplanification.domain.model.CameraRecordingState
import com.circe.visionplanification.ui.theme.StitchDesignTokens

@Composable
fun RecordingIndicator(
    recordingState: CameraRecordingState,
    durationSeconds: Long,
    modifier: Modifier = Modifier
) {
    val isRecording = recordingState == CameraRecordingState.RECORDING

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(700),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )

    val minutes = durationSeconds / 60
    val seconds = durationSeconds % 60
    val formattedTime = String.format("%02d:%02d", minutes, seconds)

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(if (isRecording) Color(0xB3EF4444) else StitchDesignTokens.SurfaceGlass)
            .border(
                width = StitchDesignTokens.GlassBorderWidth,
                color = if (isRecording) StitchDesignTokens.RecordRed else StitchDesignTokens.GlassBorderColor,
                shape = RoundedCornerShape(14.dp)
            )
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .clip(CircleShape)
                    .background(if (isRecording) Color.White else Color(0xFF64748B))
                    .then(if (isRecording) Modifier.alpha(pulseAlpha) else Modifier)
            )

            Text(
                text = if (isRecording) "REC" else "STANDBY",
                color = Color.White,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )

            if (isRecording) {
                Text(
                    text = formattedTime,
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}
`);

// 7. ui/components/RemodelControlBar.kt
writeFile('app/src/main/java/com/circe/visionplanification/ui/components/RemodelControlBar.kt', `package com.circe.visionplanification.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FiberManualRecord
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.circe.visionplanification.domain.model.CameraRecordingState
import com.circe.visionplanification.domain.model.RemodelPreset
import com.circe.visionplanification.ui.theme.StitchDesignTokens

@Composable
fun RemodelControlBar(
    currentPreset: RemodelPreset,
    recordingState: CameraRecordingState,
    onPresetSelected: (RemodelPreset) -> Unit,
    onToggleRecording: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isRecording = recordingState == CameraRecordingState.RECORDING

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(StitchDesignTokens.SurfaceGlassHeavy)
            .border(
                width = StitchDesignTokens.GlassBorderWidth,
                color = StitchDesignTokens.GlassBorderColor,
                shape = RoundedCornerShape(24.dp)
            )
            .padding(horizontal = 12.dp, vertical = 10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier
                    .weight(1f)
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                RemodelPreset.values().forEach { preset ->
                    val isSelected = preset == currentPreset

                    val bgColor by animateColorAsState(
                        targetValue = if (isSelected) StitchDesignTokens.PrimaryAccent else Color(0x331E293B),
                        label = "pillBg"
                    )
                    val textColor by animateColorAsState(
                        targetValue = if (isSelected) StitchDesignTokens.SurfaceDark else StitchDesignTokens.TextPrimary,
                        label = "pillText"
                    )

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(bgColor)
                            .border(
                                width = if (isSelected) 1.5.dp else 0.5.dp,
                                color = if (isSelected) StitchDesignTokens.PrimaryAccent else Color(0x40FFFFFF),
                                shape = RoundedCornerShape(16.dp)
                            )
                            .clickable { onPresetSelected(preset) }
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = preset.title,
                            color = textColor,
                            fontSize = 12.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }

            Box(
                modifier = Modifier
                    .padding(start = 12.dp)
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(if (isRecording) StitchDesignTokens.RecordRed else Color.White)
                    .clickable { onToggleRecording() },
                contentAlignment = Alignment.Center
            ) {
                if (isRecording) {
                    Icon(
                        imageVector = Icons.Default.Stop,
                        contentDescription = "Detener Grabación",
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.FiberManualRecord,
                        contentDescription = "Iniciar Grabación",
                        tint = StitchDesignTokens.RecordRed,
                        modifier = Modifier.size(26.dp)
                    )
                }
            }
        }
    }
}
`);

// 8. ui/components/MetricsFloatingPanel.kt
writeFile('app/src/main/java/com/circe/visionplanification/ui/components/MetricsFloatingPanel.kt', `package com.circe.visionplanification.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.circe.visionplanification.domain.model.SpatialMetrics
import com.circe.visionplanification.ui.theme.StitchDesignTokens

@Composable
fun MetricsFloatingPanel(
    metrics: SpatialMetrics,
    modifier: Modifier = Modifier
) {
    var isExpanded by remember { mutableStateOf(false) }

    val animatedEfficiency by animateFloatAsState(
        targetValue = metrics.spatialEfficiency,
        label = "effAnim"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(StitchDesignTokens.MetricsPanelCornerRadius))
            .background(StitchDesignTokens.SurfaceGlassHeavy)
            .border(
                width = StitchDesignTokens.GlassBorderWidth,
                color = StitchDesignTokens.GlassBorderColor,
                shape = RoundedCornerShape(StitchDesignTokens.MetricsPanelCornerRadius)
            )
            .padding(16.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { isExpanded = !isExpanded },
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.size(42.dp)
                    ) {
                        CircularProgressIndicator(
                            progress = { animatedEfficiency },
                            modifier = Modifier.fillMaxWidth(),
                            color = StitchDesignTokens.EfficiencyGaugeColor,
                            trackColor = Color(0x3300F0FF),
                            strokeWidth = 4.dp
                        )
                        Text(
                            text = "\${(metrics.spatialEfficiency * 100).toInt()}%",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Eficiencia Espacial",
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.Default.AutoAwesome,
                                contentDescription = null,
                                tint = StitchDesignTokens.PrimaryAccent,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                        Text(
                            text = if (isExpanded) "Toca para minimizar" else "Toca para ver desglose y directrices",
                            color = StitchDesignTokens.TextSecondary,
                            fontSize = 11.sp
                        )
                    }
                }

                Icon(
                    imageVector = if (isExpanded) Icons.Default.KeyboardArrowDown else Icons.Default.KeyboardArrowUp,
                    contentDescription = if (isExpanded) "Colapsar" else "Expandir",
                    tint = StitchDesignTokens.TextSecondary
                )
            }

            AnimatedVisibility(
                visible = isExpanded,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    MetricBarItem(
                        label = "Armonía Visual & Color",
                        value = metrics.visualHarmony,
                        color = StitchDesignTokens.AestheticGaugeColor
                    )
                    MetricBarItem(
                        label = "Flujo de Tráfico & Despeje",
                        value = metrics.trafficFlowIndex,
                        color = StitchDesignTokens.TrafficGaugeColor
                    )
                    MetricBarItem(
                        label = "Densidad de Desorden",
                        value = metrics.clutterRatio,
                        color = StitchDesignTokens.ClutterGaugeColor,
                        isInverse = true
                    )
                    MetricBarItem(
                        label = "Aprovechamiento Luz Natural",
                        value = metrics.naturalLightScore,
                        color = StitchDesignTokens.PrimaryAccent
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "Sugerencias de Optimización Local:",
                        color = StitchDesignTokens.PrimaryAccent,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        metrics.suggestions.forEach { suggestion ->
                            Row(
                                verticalAlignment = Alignment.Top,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(text = "•", color = StitchDesignTokens.PrimaryAccent, fontSize = 12.sp)
                                Text(
                                    text = suggestion,
                                    color = StitchDesignTokens.TextPrimary,
                                    fontSize = 12.sp,
                                    lineHeight = 16.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MetricBarItem(
    label: String,
    value: Float,
    color: Color,
    isInverse: Boolean = false
) {
    val percentage = (value * 100).toInt()
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = label, color = StitchDesignTokens.TextSecondary, fontSize = 11.sp)
            Text(
                text = "$percentage%",
                color = if (isInverse && value > 0.4f) StitchDesignTokens.WarningAmber else Color.White,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
        Spacer(modifier = Modifier.height(3.dp))
        LinearProgressIndicator(
            progress = { value },
            modifier = Modifier
                .fillMaxWidth()
                .height(5.dp)
                .clip(RoundedCornerShape(3.dp)),
            color = color,
            trackColor = Color(0x26FFFFFF)
        )
    }
}
`);

// 9. ui/screens/VisionRemodelScreen.kt
writeFile('app/src/main/java/com/circe/visionplanification/ui/screens/VisionRemodelScreen.kt', `package com.circe.visionplanification.ui.screens

import android.widget.Toast
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.circe.visionplanification.camera.CameraPipelineManager
import com.circe.visionplanification.ui.components.AROverlayCanvas
import com.circe.visionplanification.ui.components.MetricsFloatingPanel
import com.circe.visionplanification.ui.components.RecordingIndicator
import com.circe.visionplanification.ui.components.RemodelControlBar
import com.circe.visionplanification.ui.components.TelemetryBadge
import com.circe.visionplanification.ui.viewmodel.VisionRemodelViewModel

@Composable
fun VisionRemodelScreen(
    viewModel: VisionRemodelViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    val inferenceResult by viewModel.inferenceResult.collectAsState()
    val telemetry by viewModel.telemetry.collectAsState()
    val selectedPreset by viewModel.selectedPreset.collectAsState()
    val recordingState by viewModel.recordingState.collectAsState()
    val recordingDuration by viewModel.recordingDuration.collectAsState()

    val cameraManager = remember {
        CameraPipelineManager(
            context = context,
            lifecycleOwner = lifecycleOwner,
            frameAnalyzer = viewModel.frameAnalyzer
        ).also {
            viewModel.bindCameraPipeline(it)
        }
    }

    DisposableEffect(lifecycleOwner) {
        onDispose {
            cameraManager.release()
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                PreviewView(ctx).apply {
                    scaleType = PreviewView.ScaleType.FILL_CENTER
                    implementationMode = PreviewView.ImplementationMode.PERFORMANCE
                    cameraManager.startCamera(this)
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        AROverlayCanvas(
            inferenceResult = inferenceResult,
            modifier = Modifier.fillMaxSize()
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TelemetryBadge(telemetry = telemetry)

            RecordingIndicator(
                recordingState = recordingState,
                durationSeconds = recordingDuration
            )
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MetricsFloatingPanel(metrics = inferenceResult.metrics)

            RemodelControlBar(
                currentPreset = selectedPreset,
                recordingState = recordingState,
                onPresetSelected = { preset -> viewModel.setPreset(preset) },
                onToggleRecording = {
                    viewModel.toggleRecording { savedFile ->
                        Toast.makeText(
                            context,
                            "Sesión guardada: \${savedFile.name}",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            )
        }
    }
}
`);

// 10. ui/viewmodel/VisionRemodelViewModel.kt
writeFile('app/src/main/java/com/circe/visionplanification/ui/viewmodel/VisionRemodelViewModel.kt', `package com.circe.visionplanification.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.circe.visionplanification.camera.CameraPipelineManager
import com.circe.visionplanification.camera.FrameAnalyzer
import com.circe.visionplanification.core.telemetry.PerformanceTracker
import com.circe.visionplanification.core.telemetry.TelemetrySnapshot
import com.circe.visionplanification.data.inference.TFLiteInferenceEngine
import com.circe.visionplanification.data.stitch.StitchApiClient
import com.circe.visionplanification.data.stitch.StitchThemeManager
import com.circe.visionplanification.domain.model.CameraRecordingState
import com.circe.visionplanification.domain.model.InferenceResult
import com.circe.visionplanification.domain.model.RemodelPreset
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

class VisionRemodelViewModel(
    application: Application
) : AndroidViewModel(application) {

    val performanceTracker = PerformanceTracker()
    private val inferenceEngine = TFLiteInferenceEngine(application, performanceTracker)
    val frameAnalyzer = FrameAnalyzer(inferenceEngine)

    private val stitchApiClient = StitchApiClient()
    val stitchThemeManager = StitchThemeManager(application, stitchApiClient)

    private val _selectedPreset = MutableStateFlow(RemodelPreset.OPTIMIZE_FLOW)
    val selectedPreset: StateFlow<RemodelPreset> = _selectedPreset.asStateFlow()

    val inferenceResult: StateFlow<InferenceResult> = frameAnalyzer.inferenceResults
    val telemetry: StateFlow<TelemetrySnapshot> = performanceTracker.telemetry

    private var cameraPipelineManager: CameraPipelineManager? = null

    val recordingState: StateFlow<CameraRecordingState>
        get() = cameraPipelineManager?.recordingState ?: MutableStateFlow(CameraRecordingState.IDLE)

    val recordingDuration: StateFlow<Long>
        get() = cameraPipelineManager?.recordingDurationSeconds ?: MutableStateFlow(0L)

    init {
        viewModelScope.launch {
            stitchThemeManager.syncWithRemote()
        }
    }

    fun bindCameraPipeline(pipelineManager: CameraPipelineManager) {
        this.cameraPipelineManager = pipelineManager
    }

    fun setPreset(preset: RemodelPreset) {
        _selectedPreset.value = preset
        frameAnalyzer.currentPreset = preset
    }

    fun toggleRecording(onSaved: (File) -> Unit = {}) {
        val manager = cameraPipelineManager ?: return
        if (manager.recordingState.value == CameraRecordingState.RECORDING) {
            manager.stopRecording()
        } else {
            manager.startRecording(onSaved)
        }
    }

    override fun onCleared() {
        super.onCleared()
        inferenceEngine.close()
        cameraPipelineManager?.release()
    }
}
`);

// 11. MainActivity.kt
writeFile('app/src/main/java/com/circe/visionplanification/MainActivity.kt', `package com.circe.visionplanification

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.circe.visionplanification.ui.screens.VisionRemodelScreen
import com.circe.visionplanification.ui.theme.StitchDesignTokens
import com.circe.visionplanification.ui.theme.VisionPlanificationTheme
import com.circe.visionplanification.ui.viewmodel.VisionRemodelViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: VisionRemodelViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            VisionPlanificationTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    PermissionGuard {
                        VisionRemodelScreen(viewModel = viewModel)
                    }
                }
            }
        }
    }
}

@Composable
private fun PermissionGuard(
    content: @Composable () -> Unit
) {
    val context = LocalContext.current
    val requiredPermissions = arrayOf(
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO
    )

    var hasPermissions by remember {
        mutableStateOf(
            requiredPermissions.all {
                ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
            }
        )
    }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        hasPermissions = results[Manifest.permission.CAMERA] == true
    }

    LaunchedEffect(Unit) {
        if (!hasPermissions) {
            launcher.launch(requiredPermissions)
        }
    }

    if (hasPermissions) {
        content()
    } else {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(StitchDesignTokens.SurfaceDark)
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Acceso a Cámara y Micrófono Requerido",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Text(
                    text = "Para procesar el espacio en tiempo real a 30 FPS y registrar la sesión de remodelación simultánea, es necesario otorgar los permisos de hardware.",
                    color = StitchDesignTokens.TextSecondary,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center
                )
                Button(
                    onClick = { launcher.launch(requiredPermissions) },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = StitchDesignTokens.PrimaryAccent,
                        contentColor = StitchDesignTokens.SurfaceDark
                    )
                ) {
                    Text(text = "Conceder Permisos", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
`);

// 12. README.md
writeFile('README.md', `# VisionPlanification - On-Device CV & Realtime Space Remodeling

Aplicación móvil nativa Android (Jetpack Compose + CameraX + TensorFlow Lite + Google Stitch) para análisis y remodelación de espacios en tiempo real mientras graba a 30+ FPS.

---

## 🚀 Inicio Rápido y Ejecución

### Paso 1: Sincronizar UI con Google Stitch
En una terminal:
\`\`\`powershell
cd stitch-sync
node sync-stitch-design.js
cd ..
\`\`\`
Esto genera la especificación \`stitch_design_spec.json\` y los tokens de diseño Jetpack Compose \`StitchDesignTokens.kt\`.

### Paso 2: Compilar y Ejecutar en Android
Abre la carpeta en **Android Studio**, o mediante línea de comandos:
\`\`\`powershell
# Compilación del APK de depuración
./gradlew assembleDebug

# Si tienes un dispositivo físico o emulador conectado vía ADB:
./gradlew installDebug
adb shell am start -n com.circe.visionplanification/.MainActivity
\`\`\`

---

## 🔒 Clave de Stitch y Seguridad
La clave está configurada en \`local.properties\`:
\`\`\`properties
stitch.api.key=YOUR_STITCH_API_KEY_HERE
\`\`\`
Nunca se subirá al control de versiones por estar ignorada en \`.gitignore\`.
`);
