package com.circe.visionplanification.ui.components

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
                            text = "${(metrics.spatialEfficiency * 100).toInt()}%",
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
