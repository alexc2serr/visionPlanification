package com.circe.visionplanification.ui.screens

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
                            "Sesión guardada: ${savedFile.name}",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            )
        }
    }
}
