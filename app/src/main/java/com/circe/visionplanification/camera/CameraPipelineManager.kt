package com.circe.visionplanification.camera

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
                Log.e(TAG, "Error iniciando CameraX: ${e.message}", e)
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
        val videoFile = File(context.cacheDir, "REMODEL_SESSION_$timestamp.mp4")
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
