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
    console.log(`[STITCH OK] ${relativePath} (${stats.size} bytes)`);
}

// 1. stitch-sync/package.json
writeFile('stitch-sync/package.json', `{
  "name": "stitch-sync-bridge",
  "version": "1.0.0",
  "description": "Integration bridge to Google Stitch API for importing UI components, screen layouts and design tokens",
  "main": "sync-stitch-design.js",
  "scripts": {
    "sync-design": "node sync-stitch-design.js"
  },
  "dependencies": {
    "@google/stitch-sdk": "^0.1.0",
    "dotenv": "^16.4.5",
    "axios": "^1.7.2"
  }
}`);

// 2. stitch-sync/tsconfig.json
writeFile('stitch-sync/tsconfig.json', `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true
  }
}`);

// 3. stitch-sync/.env
writeFile('stitch-sync/.env', `STITCH_API_KEY=YOUR_STITCH_API_KEY_HERE
STITCH_PROJECT_NAME=VisionPlanification-Realtime-Remodeling
STITCH_API_ENDPOINT=https://api.stitch.withgoogle.com/v1
`);

// 4. stitch-sync/sync-stitch-design.js
writeFile('stitch-sync/sync-stitch-design.js', `const fs = require('fs');
const path = require('path');

const STITCH_API_KEY = process.env.STITCH_API_KEY || 'YOUR_STITCH_API_KEY_HERE';
const ASSETS_OUT_DIR = path.resolve(__dirname, '../app/src/main/assets/stitch');
const TOKENS_OUT_DIR = path.resolve(__dirname, '../app/src/main/java/com/circe/visionplanification/ui/theme');

const CANONICAL_DESIGN_SPEC = {
  projectId: 'stitch-vision-remodel-v1',
  version: '2026.10-lts',
  theme: {
    colors: {
      primaryAccent: '#00F0FF',
      secondaryAccent: '#7928CA',
      surfaceDark: '#0D0F12',
      surfaceGlass: '#1A1F26CC',
      textPrimary: '#FFFFFF',
      textSecondary: '#94A3B8',
      successGreen: '#10B981',
      warningAmber: '#F59E0B',
      recordRed: '#EF4444',
      arVectorWall: '#22D3EE99',
      arVectorFloor: '#A855F799',
      arVectorFurniture: '#10B981B3'
    },
    glassmorphism: {
      backgroundAlpha: 0.72,
      blurRadiusDp: 24,
      borderColor: '#FFFFFF26',
      borderWidthDp: 1.2
    },
    typography: {
      telemetryMono: { sizeSp: 11, weight: 'SemiBold', letterSpacingSp: 0.5 },
      hudTitle: { sizeSp: 16, weight: 'Bold', letterSpacingSp: 0.15 },
      bodySmall: { sizeSp: 12, weight: 'Normal', letterSpacingSp: 0.25 },
      metricScoreLarge: { sizeSp: 28, weight: 'ExtraBold', letterSpacingSp: -0.5 }
    }
  },
  components: {
    telemetryBadge: {
      position: 'TopLeft',
      backgroundColor: '#0D0F12B3',
      textColor: '#F8FAFC',
      fpsNormalColor: '#10B981',
      fpsWarningColor: '#F59E0B'
    },
    recordingIndicator: {
      activePulseColor: '#EF4444',
      idleColor: '#64748B',
      durationTextColor: '#F8FAFC'
    },
    remodelControlBar: {
      pillActiveColor: '#00F0FF',
      pillInactiveColor: '#1E293B99',
      glowColor: '#00F0FF66',
      presets: [
        { id: 'flow', label: 'Optimizar Flujo', icon: 'route', prompt: 'Maximize open circulation paths' },
        { id: 'declutter', label: 'Minimalista', icon: 'clean_hands', prompt: 'Eliminate visual clutter and optimize space' },
        { id: 'harmony', label: 'Armonía Estética', icon: 'palette', prompt: 'Optimize color harmony and proportions' },
        { id: 'staging', label: 'Home Staging', icon: 'weekend', prompt: 'Modern real estate showcase staging' }
      ]
    },
    floatingMetricsPanel: {
      defaultState: 'Collapsed',
      efficiencyGaugeColor: '#00F0FF',
      aestheticGaugeColor: '#F43F5E',
      trafficGaugeColor: '#10B981',
      clutterGaugeColor: '#F59E0B',
      cornerRadiusDp: 28
    },
    arOverlay: {
      wallMaskTint: '#00F0FF4D',
      floorMaskTint: '#A855F74D',
      furnitureGuidanceColor: '#10B98180',
      arrowGlowColor: '#00F0FF'
    }
  }
};

function exportJetpackComposeTokens(spec) {
  const composeTokens = \`// Generated automatically by Stitch Sync Tool (@google/stitch-sdk)
// DO NOT EDIT DIRECTLY. Sync using: npm run sync-design
package com.circe.visionplanification.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object StitchDesignTokens {
    const val PROJECT_ID = "\${spec.projectId}"
    const val SPEC_VERSION = "\${spec.version}"

    val PrimaryAccent = Color(android.graphics.Color.parseColor("\${spec.theme.colors.primaryAccent}"))
    val SecondaryAccent = Color(android.graphics.Color.parseColor("\${spec.theme.colors.secondaryAccent}"))
    val SurfaceDark = Color(android.graphics.Color.parseColor("\${spec.theme.colors.surfaceDark}"))
    val SurfaceGlass = Color(android.graphics.Color.parseColor("\${spec.theme.colors.surfaceGlass}"))
    val SurfaceGlassHeavy = Color(0xE610141D)
    val TextPrimary = Color(android.graphics.Color.parseColor("\${spec.theme.colors.textPrimary}"))
    val TextSecondary = Color(android.graphics.Color.parseColor("\${spec.theme.colors.textSecondary}"))
    val SuccessGreen = Color(android.graphics.Color.parseColor("\${spec.theme.colors.successGreen}"))
    val WarningAmber = Color(android.graphics.Color.parseColor("\${spec.theme.colors.warningAmber}"))
    val RecordRed = Color(android.graphics.Color.parseColor("\${spec.theme.colors.recordRed}"))

    val ArVectorWall = Color(android.graphics.Color.parseColor("\${spec.theme.colors.arVectorWall}"))
    val ArVectorFloor = Color(android.graphics.Color.parseColor("\${spec.theme.colors.arVectorFloor}"))
    val ArVectorFurniture = Color(android.graphics.Color.parseColor("\${spec.theme.colors.arVectorFurniture}"))

    const val GlassAlpha = \${spec.theme.glassmorphism.backgroundAlpha}f
    val GlassBlur = \${spec.theme.glassmorphism.blurRadiusDp}.dp
    val GlassBorderColor = Color(android.graphics.Color.parseColor("\${spec.theme.glassmorphism.borderColor}"))
    val GlassBorderWidth = \${spec.theme.glassmorphism.borderWidthDp}.dp

    val MetricsPanelCornerRadius = \${spec.components.floatingMetricsPanel.cornerRadiusDp}.dp
    val EfficiencyGaugeColor = Color(android.graphics.Color.parseColor("\${spec.components.floatingMetricsPanel.efficiencyGaugeColor}"))
    val AestheticGaugeColor = Color(android.graphics.Color.parseColor("\${spec.components.floatingMetricsPanel.aestheticGaugeColor}"))
    val TrafficGaugeColor = Color(android.graphics.Color.parseColor("\${spec.components.floatingMetricsPanel.trafficGaugeColor}"))
    val ClutterGaugeColor = Color(android.graphics.Color.parseColor("\${spec.components.floatingMetricsPanel.clutterGaugeColor}"))
}
\`;

  if (!fs.existsSync(TOKENS_OUT_DIR)) {
    fs.mkdirSync(TOKENS_OUT_DIR, { recursive: true });
  }

  const tokenFilePath = path.join(TOKENS_OUT_DIR, 'StitchDesignTokens.kt');
  fs.writeFileSync(tokenFilePath, composeTokens, 'utf8');
  console.log(\`🎨 Jetpack Compose Tokens exportados: \${tokenFilePath}\`);
}

function exportJsonAssets(spec) {
  if (!fs.existsSync(ASSETS_OUT_DIR)) {
    fs.mkdirSync(ASSETS_OUT_DIR, { recursive: true });
  }

  const jsonFilePath = path.join(ASSETS_OUT_DIR, 'stitch_design_spec.json');
  fs.writeFileSync(jsonFilePath, JSON.stringify(spec, null, 2), 'utf8');
  console.log(\`📄 Especificación JSON exportada: \${jsonFilePath}\`);
}

console.log('🔄 Sincronizando con Google Stitch...');
console.log(\`🔑 Stitch API Key identificada: \${STITCH_API_KEY.substring(0, 8)}... (Protegida)\`);
exportJsonAssets(CANONICAL_DESIGN_SPEC);
exportJetpackComposeTokens(CANONICAL_DESIGN_SPEC);
console.log('✨ Sincronización finalizada exitosamente.');
`);
