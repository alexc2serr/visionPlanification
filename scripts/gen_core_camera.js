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
    console.log(`[CORE OK] ${relativePath} (${stats.size} bytes)`);
}

// 1. VisionApp.kt
writeFile('app/src/main/java/com/circe/visionplanification/VisionApp.kt', `package com.circe.visionplanification

import android.app.Application
import android.util.Log

class VisionApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Iniciando VisionPlanification con soporte On-Device CV y Stitch Design System.")
    }

    companion object {
        const val TAG = "VisionApp"
    }
}
`);

// 2. core/security/SecurityConfig.kt
writeFile('app/src/main/java/com/circe/visionplanification/core/security/SecurityConfig.kt', `package com.circe.visionplanification.core.security

import com.circe.visionplanification.BuildConfig

object SecurityConfig {
    fun getStitchApiKey(): String {
        val key = BuildConfig.STITCH_API_KEY
        if (key.isBlank() || key.contains("YOUR_STITCH_API_KEY")) {
            throw IllegalStateException(
                "La clave STITCH_API_KEY no está configurada. " +
                "Añade 'stitch.api.key=TU_CLAVE' en local.properties o como variable de entorno STITCH_API_KEY."
            )
        }
        return key
    }

    fun getMaskedApiKey(): String {
        return try {
            val key = getStitchApiKey()
            if (key.length > 12) {
                "\${key.take(8)}...\${key.takeLast(5)}"
            } else {
                "***"
            }
        } catch (e: Exception) {
            "NO_CONFIGURADA"
        }
    }
}
`);

// 3. core/telemetry/PerformanceTracker.kt
writeFile('app/src/main/java/com/circe/visionplanification/core/telemetry/PerformanceTracker.kt', `package com.circe.visionplanification.core.telemetry

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.atomic.AtomicLong

enum class InferenceDelegateType {
    GPU,
    NNAPI,
    CPU_MULTITHREAD
}

data class TelemetrySnapshot(
    val currentFps: Double = 0.0,
    val preProcessMs: Long = 0,
    val inferenceMs: Long = 0,
    val postProcessMs: Long = 0,
    val totalLatencyMs: Long = 0,
    val delegate: InferenceDelegateType = InferenceDelegateType.GPU,
    val droppedFramesCount: Long = 0
)

class PerformanceTracker(private val windowSize: Int = 15) {
    private val _telemetry = MutableStateFlow(TelemetrySnapshot())
    val telemetry: StateFlow<TelemetrySnapshot> = _telemetry.asStateFlow()

    private val frameTimestamps = ArrayDeque<Long>(windowSize)
    private val preProcessTimes = ArrayDeque<Long>(windowSize)
    private val inferenceTimes = ArrayDeque<Long>(windowSize)
    private val postProcessTimes = ArrayDeque<Long>(windowSize)

    private val totalFramesAnalyzed = AtomicLong(0)
    private val droppedFrames = AtomicLong(0)

    private var activeDelegate = InferenceDelegateType.GPU

    fun setDelegate(delegate: InferenceDelegateType) {
        this.activeDelegate = delegate
    }

    fun onFrameDropped() {
        droppedFrames.incrementAndGet()
    }

    @Synchronized
    fun recordFrame(preProcessMs: Long, inferenceMs: Long, postProcessMs: Long) {
        val now = System.currentTimeMillis()
        totalFramesAnalyzed.incrementAndGet()

        frameTimestamps.addLast(now)
        preProcessTimes.addLast(preProcessMs)
        inferenceTimes.addLast(inferenceMs)
        postProcessTimes.addLast(postProcessMs)

        if (frameTimestamps.size > windowSize) frameTimestamps.removeFirst()
        if (preProcessTimes.size > windowSize) preProcessTimes.removeFirst()
        if (inferenceTimes.size > windowSize) inferenceTimes.removeFirst()
        if (postProcessTimes.size > windowSize) postProcessTimes.removeFirst()

        val calculatedFps = if (frameTimestamps.size >= 2) {
            val durationMs = frameTimestamps.last() - frameTimestamps.first()
            if (durationMs > 0) {
                ((frameTimestamps.size - 1) * 1000.0) / durationMs
            } else 0.0
        } else 0.0

        val avgPre = preProcessTimes.average().toLong()
        val avgInf = inferenceTimes.average().toLong()
        val avgPost = postProcessTimes.average().toLong()

        _telemetry.value = TelemetrySnapshot(
            currentFps = (calculatedFps * 10.0).toLong() / 10.0,
            preProcessMs = avgPre,
            inferenceMs = avgInf,
            postProcessMs = avgPost,
            totalLatencyMs = avgPre + avgInf + avgPost,
            delegate = activeDelegate,
            droppedFramesCount = droppedFrames.get()
        )
    }
}
`);

// 4. domain/model/RemodelModels.kt
writeFile('app/src/main/java/com/circe/visionplanification/domain/model/RemodelModels.kt', `package com.circe.visionplanification.domain.model

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
`);

// 5. camera/CameraPipelineManager.kt
writeFile('app/src/main/java/com/circe/visionplanification/camera/CameraPipelineManager.kt', `package com.circe.visionplanification.camera

import android.content.Context
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.Quality
import androidx.camera.video.QualitySelector
import androidx.camera.video.RecordEvent
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoCapture
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.circe.visionplanification.domain.model.CameraRecordingState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CameraPipelineManager(
    private val context: Context,
    private val lifecycleOwner: LifecycleOwner,
    private val frameAnalyzer: FrameAnalyzer
) {
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "VisionCameraAnalysisWorker").apply {
            priority = Thread.NORM_PRIORITY + 1
        }
    }

    private var cameraProvider: ProcessCameraProvider? = null
    private var videoCapture: VideoCapture<Recorder>? = null
    private var activeRecording: Recording? = null

    private val _recordingState = MutableStateFlow(CameraRecordingState.IDLE)
    val recordingState: StateFlow<CameraRecordingState> = _recordingState.asStateFlow()

    private val _recordingDurationSeconds = MutableStateFlow(0L)
    val recordingDurationSeconds: StateFlow<Long> = _recordingDurationSeconds.asStateFlow()

    companion object {
        private const val TAG = "CameraPipelineManager"
    }

    fun startCamera(previewView: PreviewView, onStarted: () -> Unit = {}) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)

        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()

                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
                    .build()
                    .also {
                        it.setAnalyzer(cameraExecutor, frameAnalyzer)
                    }

                val recorder = Recorder.Builder()
                    .setQualitySelector(QualitySelector.from(Quality.HD))
                    .build()
                videoCapture = VideoCapture.withOutput(recorder)

                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                cameraProvider?.unbindAll()
                cameraProvider?.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    imageAnalysis,
                    videoCapture
                )

                Log.i(TAG, "Pipeline CameraX inicializado con éxito.")
                onStarted()
            } catch (e: Exception) {
                Log.e(TAG, "Error iniciando CameraX: \${e.message}", e)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    fun startRecording(onVideoSaved: (File) -> Unit = {}) {
        val capture = videoCapture ?: run {
            Log.e(TAG, "VideoCapture no disponible.")
            return
        }

        if (activeRecording != null) return

        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val videoFile = File(context.cacheDir, "REMODEL_SESSION_\$timestamp.mp4")
        val outputOptions = FileOutputOptions.Builder(videoFile).build()

        _recordingState.value = CameraRecordingState.RECORDING

        activeRecording = capture.output
            .prepareRecording(context, outputOptions)
            .apply {
                try {
                    if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.RECORD_AUDIO)
                        == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                        withAudioEnabled()
                    }
                } catch (e: SecurityException) {
                    Log.w(TAG, "Sin audio por falta de permisos.")
                }
            }
            .start(ContextCompat.getMainExecutor(context)) { recordEvent ->
                when (recordEvent) {
                    is RecordEvent.Start -> {
                        _recordingDurationSeconds.value = 0L
                    }
                    is RecordEvent.Status -> {
                        val durationSec = recordEvent.recordingStats.recordedDurationNanos / 1_000_000_000L
                        _recordingDurationSeconds.value = durationSec
                    }
                    is RecordEvent.Finalize -> {
                        if (!recordEvent.hasError()) {
                            onVideoSaved(videoFile)
                        }
                        _recordingState.value = CameraRecordingState.IDLE
                        activeRecording = null
                        _recordingDurationSeconds.value = 0L
                    }
                }
            }
    }

    fun stopRecording() {
        if (activeRecording != null) {
            _recordingState.value = CameraRecordingState.STOPPING
            activeRecording?.stop()
            activeRecording = null
        }
    }

    fun release() {
        stopRecording()
        cameraProvider?.unbindAll()
        cameraExecutor.shutdown()
    }
}
`);

// 6. camera/FrameAnalyzer.kt
writeFile('app/src/main/java/com/circe/visionplanification/camera/FrameAnalyzer.kt', `package com.circe.visionplanification.camera

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
            android.util.Log.e("FrameAnalyzer", "Error en frame analyzer: \${e.message}")
        } finally {
            isProcessing.set(false)
            imageProxy.close()
        }
    }
}
`);
