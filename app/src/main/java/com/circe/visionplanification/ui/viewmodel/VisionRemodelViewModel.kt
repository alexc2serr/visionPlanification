package com.circe.visionplanification.ui.viewmodel

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
