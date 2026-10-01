package com.circe.visionplanification.ui.components

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
                    "✨ ${guidance.label} (${(guidance.confidence * 100).toInt()}%)",
                    targetLeft + 12f,
                    targetTop - 16f,
                    textPaint
                )
            }
        }
    }
}
