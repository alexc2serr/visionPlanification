package com.circe.visionplanification.data.stitch

import android.content.Context
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject

data class StitchUIConfig(
    val primaryAccentHex: String = "#00F0FF",
    val secondaryAccentHex: String = "#7928CA",
    val surfaceGlassHex: String = "#CC1A1F26",
    val glassAlpha: Float = 0.72f,
    val glassBlurDp: Int = 24,
    val efficiencyGaugeColorHex: String = "#00F0FF",
    val aestheticGaugeColorHex: String = "#F43F5E",
    val trafficGaugeColorHex: String = "#10B981",
    val clutterGaugeColorHex: String = "#F59E0B",
    val isLiveSynced: Boolean = false
)

class StitchThemeManager(
    private val context: Context,
    private val stitchApiClient: StitchApiClient
) {
    private val _config = MutableStateFlow(loadLocalSpec())
    val config: StateFlow<StitchUIConfig> = _config.asStateFlow()

    companion object {
        private const val TAG = "StitchThemeManager"
        private const val LOCAL_SPEC_ASSET = "stitch/stitch_design_spec.json"
    }

    private fun loadLocalSpec(): StitchUIConfig {
        return try {
            val jsonString = context.assets.open(LOCAL_SPEC_ASSET).bufferedReader().use { it.readText() }
            val json = JSONObject(jsonString)
            parseConfig(json, isLive = false)
        } catch (e: Exception) {
            Log.e(TAG, "Error leyendo especificación local Stitch: ${e.message}")
            StitchUIConfig()
        }
    }

    suspend fun syncWithRemote() {
        val remoteJson = stitchApiClient.fetchDesignSpec("VisionPlanification-Realtime-Remodeling")
        if (remoteJson != null) {
            _config.value = parseConfig(remoteJson, isLive = true)
        }
    }

    private fun parseConfig(json: JSONObject, isLive: Boolean): StitchUIConfig {
        return try {
            val theme = json.optJSONObject("theme")
            val colors = theme?.optJSONObject("colors")
            val glass = theme?.optJSONObject("glassmorphism")
            val components = json.optJSONObject("components")
            val metrics = components?.optJSONObject("floatingMetricsPanel")

            StitchUIConfig(
                primaryAccentHex = colors?.optString("primaryAccent", "#00F0FF") ?: "#00F0FF",
                secondaryAccentHex = colors?.optString("secondaryAccent", "#7928CA") ?: "#7928CA",
                surfaceGlassHex = colors?.optString("surfaceGlass", "#CC1A1F26") ?: "#CC1A1F26",
                glassAlpha = glass?.optDouble("backgroundAlpha", 0.72)?.toFloat() ?: 0.72f,
                glassBlurDp = glass?.optInt("blurRadiusDp", 24) ?: 24,
                efficiencyGaugeColorHex = metrics?.optString("efficiencyGaugeColor", "#00F0FF") ?: "#00F0FF",
                aestheticGaugeColorHex = metrics?.optString("aestheticGaugeColor", "#F43F5E") ?: "#F43F5E",
                trafficGaugeColorHex = metrics?.optString("trafficGaugeColor", "#10B981") ?: "#10B981",
                clutterGaugeColorHex = metrics?.optString("clutterGaugeColor", "#F59E0B") ?: "#F59E0B",
                isLiveSynced = isLive
            )
        } catch (e: Exception) {
            StitchUIConfig()
        }
    }
}
