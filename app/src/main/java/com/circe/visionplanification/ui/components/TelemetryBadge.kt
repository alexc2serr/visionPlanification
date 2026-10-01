package com.circe.visionplanification.ui.components

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
                    text = "${telemetry.currentFps}",
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
                    text = "${telemetry.inferenceMs} ms",
                    color = StitchDesignTokens.PrimaryAccent,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "inf (${telemetry.totalLatencyMs}ms total)",
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
