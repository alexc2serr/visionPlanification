# Guía de Entrenamiento de Modelos de Detección de Objetos Personalizados

Bienvenido a la guía integral de entrenamiento, optimización y despliegue de modelos de visión por computador para **VisionPlanification**. Este módulo permite entrenar redes neuronales de detección de objetos en tiempo real basadas en **YOLOv8** (Ultralytics) especializadas en mobiliario y objetos de oficina, exportándolas automáticamente a **TensorFlow Lite (TFLite)** para la aplicación Android y **TensorFlow.js (TF.js)** para el simulador web (`web-simulator`).

---

## 1. Clases Personalizadas del Modelo

El modelo está diseñado para detectar 8 categorías clave de mobiliario y objetos personales de oficina para el análisis de distribución espacial y remodelación en Realidad Aumentada (AR):

| ID | Nombre de Clase | Nombre en Inglés | Descripción y Criterios de Anotación |
|:--:|:----------------|:-----------------|:--------------------------------------|
| `0` | `cajonera` | Filing Cabinet | Cajoneras rodantes o módulos de cajones bajo mesa o auxiliares de oficina. |
| `1` | `casco_de_moto` | Motorcycle Helmet | Cascos integrales, modulares o abiertos colocados sobre escritorios o estantes. |
| `2` | `mochila` | Backpack | Mochilas de trabajo, maletines o bolsos apoyados en suelo o colgados en sillas. |
| `3` | `pantalla` | Monitor / Screen | Pantallas de ordenador de escritorio, displays externos y monitores dobles. |
| `4` | `portatil` | Laptop | Ordenadores portátiles en posición abierta o cerrada sobre el área de trabajo. |
| `5` | `silla_oficina` | Office Chair | Sillas ergonómicas giratorias, sillas con ruedas y sillas de conferencia. |
| `6` | `mesa_escritorio` | Desk | Mesas individuales de trabajo, estaciones compartidas (bench) o de reunión. |
| `7` | `separador` | Office Partition | Mamparas divisorias, paneles fonoabsorbentes entre puestos o separadores móviles. |

---

## 2. Configuración del Entorno en Windows

### Requisitos Previos
- **Python 3.10 o superior** (compatible con Python 3.10, 3.11, 3.12 y 3.14).
- **Node.js v18+** (para exportación y conversión a TensorFlow.js).
- **NVIDIA GPU** con soporte CUDA (opcional pero altamente recomendado para acelerar el entrenamiento).

### Paso 1: Crear y activar un entorno virtual
Abrir PowerShell en la raíz del proyecto o en la carpeta `training/`:
```powershell
cd "c:\Users\AlejandroSerranoCalv\OneDrive - Fundacion CIRCE\Personal\VisionPlanification\training"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Paso 2: Instalar PyTorch con aceleración CUDA (Opcional si dispone de GPU NVIDIA)
Si cuenta con GPU NVIDIA, instale la versión de PyTorch compilada con CUDA (por ejemplo, CUDA 12.1):
```powershell
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```
*Si solo utiliza CPU, este paso puede omitirse ya que `requirements.txt` instalará la versión estándar.*

### Paso 3: Instalar dependencias del proyecto
```powershell
pip install -r requirements.txt
```

### Paso 4: Validar instalación del entorno
```powershell
python -c "import torch, ultralytics; print('PyTorch:', torch.__version__, '| CUDA disponible:', torch.cuda.is_available(), '| Ultralytics:', ultralytics.__version__)"
```

---

## 3. Recolección de Datos con `collect_frames.py`

Para capturar rápidamente imágenes reales de tu entorno de oficina utilizando la webcam del equipo:

```powershell
python collect_frames.py --camera-id 0 --output-dir dataset/raw_images
```

### Interacción y Atajos de Teclado:
- Al iniciar, el script mostrará un menú numerado para elegir la clase activa (ej. `1` para `cajonera`, `6` para `silla_oficina`, etc.).
- **`[C]`**: Captura un fotograma individual y lo guarda en `dataset/raw_images/<clase>/`.
- **`[B]`**: Modo ráfaga (toma 5 fotografías automáticas espaciadas por 0.2 segundos).
- **`[S]`**: Cambia la clase activa en tiempo de ejecución sin cerrar la cámara.
- **`[Q]` o `[ESC]`**: Cierra la sesión y muestra un resumen de las capturas realizadas.

> [!TIP]
> **Recomendaciones para un dataset robusto:**
> - Capture entre **150 y 300 imágenes por clase**.
> - Varíe los ángulos de captura (vista frontal, lateral, ángulo picado 30°-45°).
> - Varíe las condiciones de luz (luz natural de ventana, luz fluorescente, sombras).
> - Incluya oclusiones parciales (ej. silla parcialmente oculta tras la mesa, mochila en el suelo junto a la cajonera).

---

## 4. Etiquetado y Anotación

Una vez recolectadas las imágenes en `dataset/raw_images/`, deben anotarse con cajas delimitadoras (*bounding boxes*).

### Opción A: Roboflow (Recomendada para productividad)
1. Iniciar sesión en [Roboflow](https://roboflow.com).
2. Crear un nuevo proyecto de tipo **Object Detection**.
3. Subir las imágenes recolectadas.
4. Anotar las cajas con los nombres de las 8 clases exactas: `cajonera`, `casco_de_moto`, `mochila`, `pantalla`, `portatil`, `silla_oficina`, `mesa_escritorio`, `separador`.
5. En la sección **Generate**, configurar la partición:
   - **Train**: 70%
   - **Valid**: 20%
   - **Test**: 10%
6. Añadir aumentaciones de datos recomendadas:
   - Flip horizontal (50%)
   - Brillo: entre -15% y +15%
   - Rotación leve: entre -10° y +10°
7. Exportar en formato **YOLOv8** y descargar el archivo ZIP.
8. Descomprimir el contenido dentro de `training/dataset/`.

### Opción B: LabelImg (Herramienta local gratuita)
1. Instalar LabelImg: `pip install labelImg`
2. Ejecutar: `labelImg`
3. Configurar formato a **YOLO** en el menú lateral izquierdo.
4. Establecer el directorio de guardado en `training/dataset/labels/train` y el de imágenes en `training/dataset/images/train`.

### Formato de Anotación YOLO
Cada imagen `imagen.jpg` tiene un archivo de texto homónimo `imagen.txt` donde cada línea representa un objeto:
```text
<class_id> <x_center> <y_center> <width> <height>
```
*Todas las coordenadas son relativas y están normalizadas entre 0.0 y 1.0.*

---

## 5. Estructura del Directorio del Dataset

La estructura requerida en `training/dataset/` es la siguiente:

```text
training/
├── data.yaml                     # Archivo de configuración YOLOv8
├── dataset/
│   ├── images/
│   │   ├── train/                # Imágenes de entrenamiento (~70%)
│   │   ├── val/                  # Imágenes de validación (~20%)
│   │   └── test/                 # Imágenes de prueba (~10%, opcional)
│   └── labels/
│       ├── train/                # Archivos .txt de anotación YOLO
│       ├── val/
│       └── test/
```

---

## 6. Entrenamiento del Modelo con `train_custom_model.py`

El script `train_custom_model.py` realiza el fine-tuning de la red base `yolov8n.pt` adaptándola a las 8 clases de oficina.

### Ejecución Básica (Valores por defecto recomendados):
```powershell
python train_custom_model.py --data data.yaml --epochs 100 --batch 16 --imgsz 640
```

### Argumentos de Línea de Comandos:
- `--data`: Ruta al archivo `data.yaml` (por defecto: `data.yaml`).
- `--model`: Pesos preentrenados de inicio (por defecto: `yolov8n.pt`).
- `--epochs`: Número de épocas de entrenamiento (por defecto: `100`).
- `--imgsz`: Resolución cuadrada de entrada en píxeles (por defecto: `640`).
- `--batch`: Tamaño de lote / batch size (por defecto: `16`). Reducir a `8` o `4` si la VRAM de la GPU es limitada.
- `--device`: Dispositivo de cómputo (`'0'` para GPU NVIDIA o `'cpu'`). Por defecto detecta automáticamente.
- `--workers`: Hilos para carga de datos (por defecto `2` para estabilidad en Windows).
- `--project`: Directorio de guardado (por defecto: `runs/train`).
- `--name`: Nombre del experimento (por defecto: `office_custom_yolov8n`).
- `--export`: Formatos a exportar tras entrenar (por defecto: `tflite onnx`).

### Ejemplo Avanzado con GPU y Exportación Automática:
```powershell
python train_custom_model.py --data data.yaml --epochs 120 --batch 16 --imgsz 640 --device 0 --export tflite onnx
```

---

## 7. Exportación a TensorFlow.js y Android TFLite

El script `export_to_tfjs.py` toma los mejores pesos entrenados (`best.pt`) y genera los formatos listos para producción:

```powershell
python export_to_tfjs.py --weights runs/train/office_custom_yolov8n/weights/best.pt --output-dir ../web-simulator/models/custom_yolov8n_tfjs --copy-android
```

### Flujo de Exportación:
1. **Ultralytics PyTorch (`.pt`)** -> **TensorFlow SavedModel (`saved_model/`)**.
2. **SavedModel** -> **TensorFlow.js Graph Model (`model.json` + fragmentos binarios `group1-shard*.bin`)** mediante `tensorflowjs_converter`.
3. Copia automática de los archivos a `web-simulator/models/custom_yolov8n_tfjs/`.
4. Creación de `metadata.json` con etiquetas y parámetros de inferencia para el navegador.
5. Con el flag `--copy-android`, exporta el modelo TFLite cuantizado y lo copia a:
   `app/src/main/assets/models/spatial_remodeler_quant.tflite` para uso inmediato en la app Android.

---

## 8. Flujo de Trabajo Completo (Resumen)

```text
[1. collect_frames.py]  ==>  Captura de fotos con webcam
           │
           ▼
[2. Roboflow / LabelImg] ==>  Anotación de bounding boxes en formato YOLO
           │
           ▼
[3. dataset/ images & labels] ==> Partición 70% train / 20% val / 10% test
           │
           ▼
[4. train_custom_model.py] ==> Fine-tuning de yolov8n.pt (100 épocas, mAP50)
           │
           ▼
[5. export_to_tfjs.py]  ==> Exportación a TF.js (Web) y TFLite (Android)
           │
   ┌───────┴────────────────────────┐
   ▼                                ▼
web-simulator/models/       app/src/main/assets/models/
(Simulador Web Interactivo) (App Móvil Android con ARCore)
```

---

## 9. Solución de Problemas Frecuentes en Windows

### 1. `RuntimeError: DataLoader worker (pid ...) is killed by signal`
En Windows, el subsistema de multiprocessing de PyTorch puede experimentar errores de memoria compartida con workers múltiples.
- **Solución**: Ejecute con `--workers 0` o `--workers 2`. El script `train_custom_model.py` ya incluye salvaguardas y bloque `if __name__ == '__main__':`.

### 2. `CUDA out of memory`
La memoria de la tarjeta gráfica se ha saturado.
- **Solución**: Reduzca el tamaño de lote con `--batch 8` o `--batch 4`, o reduzca el tamaño de imagen con `--imgsz 480` o `--imgsz 512`.

### 3. Error en TensorFlow.js Converter (`command not found`)
Si `tensorflowjs_converter` no está en el PATH del sistema:
- **Solución**: Instale el paquete dentro del entorno virtual:
  ```powershell
  pip install tensorflowjs
  ```
  O ejecute mediante el módulo de python: `python -m tensorflowjs.converters.converter ...`.

### 4. Rutas y Sincronización en OneDrive
Si experimenta retrasos por sincronización en segundo plano de OneDrive sobre la carpeta `runs/`:
- **Solución**: Puede configurar `--project C:\temp_runs\train` para guardar los puntos de control temporalmente en el disco local y luego copiar los pesos finales.
