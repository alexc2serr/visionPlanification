package com.circe.visionplanification.ui.components

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
