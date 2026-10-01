package com.circe.visionplanification.camera

import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.circe.visionplanification.data.inference.TFLiteInferenceEngine
import com.circe.visionplanification.domain.model.InferenceResult
import com.circe.visionplanification.domain.model.RemodelPreset
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.atomic.AtomicBoolean

class FrameAnalyzer(
    private val inferenceEngine: TFLiteInferenceEngine
) : ImageAnalysis.Analyzer {

    private val _inferenceResults = MutableStateFlow(InferenceResult())
    val inferenceResults: StateFlow<InferenceResult> = _inferenceResults.asStateFlow()

    @Volatile
    var currentPreset: RemodelPreset = RemodelPreset.OPTIMIZE_FLOW

    private val isProcessing = AtomicBoolean(false)

    @OptIn(ExperimentalGetImage::class)
    override fun analyze(imageProxy: ImageProxy) {
        if (isProcessing.get()) {
            imageProxy.close()
            return
        }

        try {
            isProcessing.set(true)
            val bitmap = imageProxy.toBitmap()

            val rotationDegrees = imageProxy.imageInfo.rotationDegrees
            val rotatedBitmap = if (rotationDegrees != 0) {
                val matrix = Matrix().apply { postRotate(rotationDegrees.toFloat()) }
                Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
            } else {
                bitmap
            }

            val result = inferenceEngine.analyzeFrame(rotatedBitmap, currentPreset)
            _inferenceResults.value = result
        } catch (e: Exception) {
            android.util.Log.e("FrameAnalyzer", "Error en frame analyzer: ${e.message}")
        } finally {
            isProcessing.set(false)
            imageProxy.close()
        }
    }
}
