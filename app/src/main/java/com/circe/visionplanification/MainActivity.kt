package com.circe.visionplanification

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.circe.visionplanification.ui.screens.VisionRemodelScreen
import com.circe.visionplanification.ui.theme.StitchDesignTokens
import com.circe.visionplanification.ui.theme.VisionPlanificationTheme
import com.circe.visionplanification.ui.viewmodel.VisionRemodelViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: VisionRemodelViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            VisionPlanificationTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    PermissionGuard {
                        VisionRemodelScreen(viewModel = viewModel)
                    }
                }
            }
        }
    }
}

@Composable
private fun PermissionGuard(
    content: @Composable () -> Unit
) {
    val context = LocalContext.current
    val requiredPermissions = arrayOf(
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO
    )

    var hasPermissions by remember {
        mutableStateOf(
            requiredPermissions.all {
                ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
            }
        )
    }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        hasPermissions = results[Manifest.permission.CAMERA] == true
    }

    LaunchedEffect(Unit) {
        if (!hasPermissions) {
            launcher.launch(requiredPermissions)
        }
    }

    if (hasPermissions) {
        content()
    } else {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(StitchDesignTokens.SurfaceDark)
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Acceso a Cámara y Micrófono Requerido",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Text(
                    text = "Para procesar el espacio en tiempo real a 30 FPS y registrar la sesión de remodelación simultánea, es necesario otorgar los permisos de hardware.",
                    color = StitchDesignTokens.TextSecondary,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center
                )
                Button(
                    onClick = { launcher.launch(requiredPermissions) },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = StitchDesignTokens.PrimaryAccent,
                        contentColor = StitchDesignTokens.SurfaceDark
                    )
                ) {
                    Text(text = "Conceder Permisos", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
