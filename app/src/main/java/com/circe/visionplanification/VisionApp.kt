package com.circe.visionplanification

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
