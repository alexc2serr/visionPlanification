package com.circe.visionplanification.core.telemetry

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
