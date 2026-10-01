# VisionPlanification ?????

Sistema de analisis espacial y remodelacion en tiempo real para oficinas mediante **Vision por Computador On-Device (Edge AI)**, interfaz inspirada en **Google Stitch** y modelos de deteccion optimizados (**YOLOv8** y **COCO-SSD**).

---

## ?? Inicio Rapido (En 1 solo comando)

En cualquier ordenador con **Node.js** y **Python 3.10+**:

### Opcion A (Windows - Doble clic o consola):
Simplemente ejecuta:
`cmd
start.bat
`
Te permitira elegir en un menu:
1. Abrir el **Simulador Web con Stitch HUD en tiempo real**.
2. Lanzar la **Webcam con deteccion YOLOv8 nativa**.
3. Descargar datos de Google y reentrenar el modelo.

### Opcion B (Comandos directos en terminal):

#### 1. Simulador Web Interactivo (Recomendado)
`ash
node web-simulator/server.js
`
Abre en tu navegador **http://localhost:3000** con:
- Deteccion de mas de 80 categorias de objetos.
- Calculo de despeje de corredor de paso, desorden de superficies y balance visual.
- Presets de remodelacion (*Optimizar Flujo*, *Minimalista*, *Armonia*, *Home Staging*).
- Telemetria de FPS y latencia de inferencia en tiempo real.

#### 2. Deteccion en Webcam con Modelo Personalizado (Python YOLO)
`powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install ultralytics opencv-python Pillow
python training/run_webcam.py
`

---

## ?? Entrenamiento con Google Open Images V7

Herramientas para descargar fotos anotadas directamente de Google y entrenar:

`powershell
# 1. Descarga automatica de fotos etiquetadas de Google
python training/download_open_images.py --max-samples 150

# 2. Division de particiones Train / Validation
python training/split_dataset.py

# 3. Entrenamiento con YOLOv8
python -c "from ultralytics import YOLO; m = YOLO('yolov8n.pt'); m.train(data='dataset/yolo_dataset/dataset.yaml', epochs=50, imgsz=416, batch=8)"
`

### Clases personalizadas:
- cajonera (Filing cabinet)
- casco_de_moto (Motorcycle / Helmet)
- mochila (Backpack)
- pantalla (Computer monitor)
- portatil (Laptop)
- silla_oficina (Office chair)
- mesa_escritorio (Desk)
- separador (Office partition / Shelf)

---

## ?? Proyecto Nativo Android (Jetpack Compose + CameraX + TFLite)

La carpeta /app contiene la arquitectura completa nativa en Kotlin:
- **Clean Architecture / MVVM**.
- **CameraX** con pipeline desacoplado a 30+ FPS.
- Integracion de diseno sincronizado con Google Stitch Design Tokens.

---

## ?? Estructura del Repositorio

- start.bat: Lanzador rapido interactivo
- web-simulator/: Aplicacion web y servidor local
- models/: Pesos entrenados (est.pt, est.onnx)
- 	raining/: Scripts de descarga, entrenamiento y visor webcam
- pp/: Codigo fuente nativo para Android
