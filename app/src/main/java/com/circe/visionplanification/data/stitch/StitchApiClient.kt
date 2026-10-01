package com.circe.visionplanification.data.stitch

import android.util.Log
import com.circe.visionplanification.BuildConfig
import com.circe.visionplanification.core.security.SecurityConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class StitchApiClient(
    private val baseUrl: String = BuildConfig.STITCH_BASE_URL
) {
    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    companion object {
        private const val TAG = "StitchApiClient"
    }

    suspend fun fetchDesignSpec(projectName: String): JSONObject? = withContext(Dispatchers.IO) {
        try {
            val apiKey = SecurityConfig.getStitchApiKey()
            val jsonBody = JSONObject().apply {
                put("projectName", projectName)
                put("targetPlatform", "Android Jetpack Compose")
            }

            val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("${baseUrl}projects/$projectName/spec")
                .header("Authorization", "Bearer $apiKey")
                .header("User-Agent", "VisionPlanification-Android/1.0")
                .post(requestBody)
                .build()

            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                val responseBody = response.body?.string() ?: return@withContext null
                return@withContext JSONObject(responseBody)
            }
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo conectar a Google Stitch API en nube (${e.message}). Usando especificación local.")
        }
        return@withContext null
    }
}
