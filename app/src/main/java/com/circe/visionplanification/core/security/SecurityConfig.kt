package com.circe.visionplanification.core.security

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
                "${key.take(8)}...${key.takeLast(5)}"
            } else {
                "***"
            }
        } catch (e: Exception) {
            "NO_CONFIGURADA"
        }
    }
}
