package com.circe.visionplanification.domain.model

import android.graphics.Bitmap
import android.graphics.RectF

enum class GuidanceAction {
    MOVE,
    ROTATE,
    SWAP,
    REMOVE,
    ALIGN
}

enum class RemodelPreset(val id: String, val title: String, val description: String) {
    OPTIMIZE_FLOW("flow", "Optimizar Flujo", "Maximiza despeje de corredores y circulación natural."),
    DECLUTTER_MINIMAL("declutter", "Minimalista", "Reduce fatiga visual eliminando acumulación de elementos."),
    AESTHETIC_BALANCE("aesthetic", "Armonía Estética", "Regla de tercios, proporción áurea y paletas armónicas."),
    HOME_STAGING("staging", "Home Staging", "Preparación visual de alto impacto para venta/alquiler.")
}

data class RemodelGuidance(
    val id: String,
    val label: String,
    val originalBounds: RectF,
    val targetBounds: RectF,
    val action: GuidanceAction,
    val confidence: Float,
    val instruction: String
)

data class SpatialMetrics(
    val spatialEfficiency: Float = 0.72f,
    val visualHarmony: Float = 0.65f,
    val trafficFlowIndex: Float = 0.80f,
    val clutterRatio: Float = 0.28f,
    val naturalLightScore: Float = 0.85f,
    val suggestions: List<String> = emptyList()
)

data class InferenceResult(
    val maskBitmap: Bitmap? = null,
    val metrics: SpatialMetrics = SpatialMetrics(),
    val guidanceList: List<RemodelGuidance> = emptyList(),
    val timestamp: Long = System.currentTimeMillis()
)

enum class CameraRecordingState {
    IDLE,
    RECORDING,
    STOPPING,
    ERROR
}
