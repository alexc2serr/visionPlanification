// ============================================================================
// VisionPlanification - Generador de Componentes de Entrenamiento
// ============================================================================
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
    console.log(`[TRAINING OK] ${relativePath} (${stats.size} bytes)`);
}

// 1. training/README.md
writeFile('training/README.md', `# Guía de Entrenamiento de Modelos de Detección de Objetos Personalizados

Bienvenido a la guía integral de entrenamiento, optimización y despliegue de modelos de visión por computador para **VisionPlanification**. Este módulo permite entrenar redes neuronales de detección de objetos en tiempo real basadas en **YOLOv8** (Ultralytics) especializadas en mobiliario y objetos de oficina, exportándolas automáticamente a **TensorFlow Lite (TFLite)** para la aplicación Android y **TensorFlow.js (TF.js)** para el simulador web (\`web-simulator\`).

---

## 1. Clases Personalizadas del Modelo

El modelo está diseñado para detectar 8 categorías clave de mobiliario y objetos personales de oficina para el análisis de distribución espacial y remodelación en Realidad Aumentada (AR):

| ID | Nombre de Clase | Nombre en Inglés | Descripción y Criterios de Anotación |
|:--:|:----------------|:-----------------|:--------------------------------------|
| \`0\` | \`cajonera\` | Filing Cabinet | Cajoneras rodantes o módulos de cajones bajo mesa o auxiliares de oficina. |
| \`1\` | \`casco_de_moto\` | Motorcycle Helmet | Cascos integrales, modulares o abiertos colocados sobre escritorios o estantes. |
| \`2\` | \`mochila\` | Backpack | Mochilas de trabajo, maletines o bolsos apoyados en suelo o colgados en sillas. |
| \`3\` | \`pantalla\` | Monitor / Screen | Pantallas de ordenador de escritorio, displays externos y monitores dobles. |
| \`4\` | \`portatil\` | Laptop | Ordenadores portátiles en posición abierta o cerrada sobre el área de trabajo. |
| \`5\` | \`silla_oficina\` | Office Chair | Sillas ergonómicas giratorias, sillas con ruedas y sillas de conferencia. |
| \`6\` | \`mesa_escritorio\` | Desk | Mesas individuales de trabajo, estaciones compartidas (bench) o de reunión. |
| \`7\` | \`separador\` | Office Partition | Mamparas divisorias, paneles fonoabsorbentes entre puestos o separadores móviles. |

---

## 2. Configuración del Entorno en Windows

### Requisitos Previos
- **Python 3.10 o superior** (compatible con Python 3.10, 3.11, 3.12 y 3.14).
- **Node.js v18+** (para exportación y conversión a TensorFlow.js).
- **NVIDIA GPU** con soporte CUDA (opcional pero altamente recomendado para acelerar el entrenamiento).

### Paso 1: Crear y activar un entorno virtual
Abrir PowerShell en la raíz del proyecto o en la carpeta \`training/\`:
\`\`\`powershell
cd "c:\\Users\\AlejandroSerranoCalv\\OneDrive - Fundacion CIRCE\\Personal\\VisionPlanification\\training"
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
\`\`\`

### Paso 2: Instalar PyTorch con aceleración CUDA (Opcional si dispone de GPU NVIDIA)
Si cuenta con GPU NVIDIA, instale la versión de PyTorch compilada con CUDA (por ejemplo, CUDA 12.1):
\`\`\`powershell
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
\`\`\`
*Si solo utiliza CPU, este paso puede omitirse ya que \`requirements.txt\` instalará la versión estándar.*

### Paso 3: Instalar dependencias del proyecto
\`\`\`powershell
pip install -r requirements.txt
\`\`\`

### Paso 4: Validar instalación del entorno
\`\`\`powershell
python -c "import torch, ultralytics; print('PyTorch:', torch.__version__, '| CUDA disponible:', torch.cuda.is_available(), '| Ultralytics:', ultralytics.__version__)"
\`\`\`

---

## 3. Recolección de Datos con \`collect_frames.py\`

Para capturar rápidamente imágenes reales de tu entorno de oficina utilizando la webcam del equipo:

\`\`\`powershell
python collect_frames.py --camera-id 0 --output-dir dataset/raw_images
\`\`\`

### Interacción y Atajos de Teclado:
- Al iniciar, el script mostrará un menú numerado para elegir la clase activa (ej. \`1\` para \`cajonera\`, \`6\` para \`silla_oficina\`, etc.).
- **\`[C]\`**: Captura un fotograma individual y lo guarda en \`dataset/raw_images/<clase>/\`.
- **\`[B]\`**: Modo ráfaga (toma 5 fotografías automáticas espaciadas por 0.2 segundos).
- **\`[S]\`**: Cambia la clase activa en tiempo de ejecución sin cerrar la cámara.
- **\`[Q]\` o \`[ESC]\`**: Cierra la sesión y muestra un resumen de las capturas realizadas.

> [!TIP]
> **Recomendaciones para un dataset robusto:**
> - Capture entre **150 y 300 imágenes por clase**.
> - Varíe los ángulos de captura (vista frontal, lateral, ángulo picado 30°-45°).
> - Varíe las condiciones de luz (luz natural de ventana, luz fluorescente, sombras).
> - Incluya oclusiones parciales (ej. silla parcialmente oculta tras la mesa, mochila en el suelo junto a la cajonera).

---

## 4. Etiquetado y Anotación

Una vez recolectadas las imágenes en \`dataset/raw_images/\`, deben anotarse con cajas delimitadoras (*bounding boxes*).

### Opción A: Roboflow (Recomendada para productividad)
1. Iniciar sesión en [Roboflow](https://roboflow.com).
2. Crear un nuevo proyecto de tipo **Object Detection**.
3. Subir las imágenes recolectadas.
4. Anotar las cajas con los nombres de las 8 clases exactas: \`cajonera\`, \`casco_de_moto\`, \`mochila\`, \`pantalla\`, \`portatil\`, \`silla_oficina\`, \`mesa_escritorio\`, \`separador\`.
5. En la sección **Generate**, configurar la partición:
   - **Train**: 70%
   - **Valid**: 20%
   - **Test**: 10%
6. Añadir aumentaciones de datos recomendadas:
   - Flip horizontal (50%)
   - Brillo: entre -15% y +15%
   - Rotación leve: entre -10° y +10°
7. Exportar en formato **YOLOv8** y descargar el archivo ZIP.
8. Descomprimir el contenido dentro de \`training/dataset/\`.

### Opción B: LabelImg (Herramienta local gratuita)
1. Instalar LabelImg: \`pip install labelImg\`
2. Ejecutar: \`labelImg\`
3. Configurar formato a **YOLO** en el menú lateral izquierdo.
4. Establecer el directorio de guardado en \`training/dataset/labels/train\` y el de imágenes en \`training/dataset/images/train\`.

### Formato de Anotación YOLO
Cada imagen \`imagen.jpg\` tiene un archivo de texto homónimo \`imagen.txt\` donde cada línea representa un objeto:
\`\`\`text
<class_id> <x_center> <y_center> <width> <height>
\`\`\`
*Todas las coordenadas son relativas y están normalizadas entre 0.0 y 1.0.*

---

## 5. Estructura del Directorio del Dataset

La estructura requerida en \`training/dataset/\` es la siguiente:

\`\`\`text
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
\`\`\`

---

## 6. Entrenamiento del Modelo con \`train_custom_model.py\`

El script \`train_custom_model.py\` realiza el fine-tuning de la red base \`yolov8n.pt\` adaptándola a las 8 clases de oficina.

### Ejecución Básica (Valores por defecto recomendados):
\`\`\`powershell
python train_custom_model.py --data data.yaml --epochs 100 --batch 16 --imgsz 640
\`\`\`

### Argumentos de Línea de Comandos:
- \`--data\`: Ruta al archivo \`data.yaml\` (por defecto: \`data.yaml\`).
- \`--model\`: Pesos preentrenados de inicio (por defecto: \`yolov8n.pt\`).
- \`--epochs\`: Número de épocas de entrenamiento (por defecto: \`100\`).
- \`--imgsz\`: Resolución cuadrada de entrada en píxeles (por defecto: \`640\`).
- \`--batch\`: Tamaño de lote / batch size (por defecto: \`16\`). Reducir a \`8\` o \`4\` si la VRAM de la GPU es limitada.
- \`--device\`: Dispositivo de cómputo (\`'0'\` para GPU NVIDIA o \`'cpu'\`). Por defecto detecta automáticamente.
- \`--workers\`: Hilos para carga de datos (por defecto \`2\` para estabilidad en Windows).
- \`--project\`: Directorio de guardado (por defecto: \`runs/train\`).
- \`--name\`: Nombre del experimento (por defecto: \`office_custom_yolov8n\`).
- \`--export\`: Formatos a exportar tras entrenar (por defecto: \`tflite onnx\`).

### Ejemplo Avanzado con GPU y Exportación Automática:
\`\`\`powershell
python train_custom_model.py --data data.yaml --epochs 120 --batch 16 --imgsz 640 --device 0 --export tflite onnx
\`\`\`

---

## 7. Exportación a TensorFlow.js y Android TFLite

El script \`export_to_tfjs.py\` toma los mejores pesos entrenados (\`best.pt\`) y genera los formatos listos para producción:

\`\`\`powershell
python export_to_tfjs.py --weights runs/train/office_custom_yolov8n/weights/best.pt --output-dir ../web-simulator/models/custom_yolov8n_tfjs --copy-android
\`\`\`

### Flujo de Exportación:
1. **Ultralytics PyTorch (\`.pt\`)** -> **TensorFlow SavedModel (\`saved_model/\`)**.
2. **SavedModel** -> **TensorFlow.js Graph Model (\`model.json\` + fragmentos binarios \`group1-shard*.bin\`)** mediante \`tensorflowjs_converter\`.
3. Copia automática de los archivos a \`web-simulator/models/custom_yolov8n_tfjs/\`.
4. Creación de \`metadata.json\` con etiquetas y parámetros de inferencia para el navegador.
5. Con el flag \`--copy-android\`, exporta el modelo TFLite cuantizado y lo copia a:
   \`app/src/main/assets/models/spatial_remodeler_quant.tflite\` para uso inmediato en la app Android.

---

## 8. Flujo de Trabajo Completo (Resumen)

\`\`\`text
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
\`\`\`

---

## 9. Solución de Problemas Frecuentes en Windows

### 1. \`RuntimeError: DataLoader worker (pid ...) is killed by signal\`
En Windows, el subsistema de multiprocessing de PyTorch puede experimentar errores de memoria compartida con workers múltiples.
- **Solución**: Ejecute con \`--workers 0\` o \`--workers 2\`. El script \`train_custom_model.py\` ya incluye salvaguardas y bloque \`if __name__ == '__main__':\`.

### 2. \`CUDA out of memory\`
La memoria de la tarjeta gráfica se ha saturado.
- **Solución**: Reduzca el tamaño de lote con \`--batch 8\` o \`--batch 4\`, o reduzca el tamaño de imagen con \`--imgsz 480\` o \`--imgsz 512\`.

### 3. Error en TensorFlow.js Converter (\`command not found\`)
Si \`tensorflowjs_converter\` no está en el PATH del sistema:
- **Solución**: Instale el paquete dentro del entorno virtual:
  \`\`\`powershell
  pip install tensorflowjs
  \`\`\`
  O ejecute mediante el módulo de python: \`python -m tensorflowjs.converters.converter ...\`.

### 4. Rutas y Sincronización en OneDrive
Si experimenta retrasos por sincronización en segundo plano de OneDrive sobre la carpeta \`runs/\`:
- **Solución**: Puede configurar \`--project C:\\temp_runs\\train\` para guardar los puntos de control temporalmente en el disco local y luego copiar los pesos finales.
`);

// 2. training/train_custom_model.py
writeFile('training/train_custom_model.py', `# -*- coding: utf-8 -*-
"""
VisionPlanification - Entrenamiento de Modelo Personalizado YOLOv8
Fine-tuning de yolov8n.pt para deteccion de objetos de oficina y remodelacion espacial.
"""

import argparse
import os
import sys
from pathlib import Path
import yaml
import torch
from ultralytics import YOLO


# Clases oficiales del proyecto para deteccion y remodelacion espacial
CUSTOM_CLASSES = [
    "cajonera",
    "casco_de_moto",
    "mochila",
    "pantalla",
    "portatil",
    "silla_oficina",
    "mesa_escritorio",
    "separador",
]


def generate_data_yaml_template(output_path="data.yaml", dataset_root="./dataset", classes=None):
    """
    Genera una plantilla de configuracion data.yaml para YOLOv8 si no existe.
    Configura rutas relativas normalizadas y el catalogo oficial de 8 clases.
    """
    if classes is None:
        classes = CUSTOM_CLASSES

    output_path = Path(output_path).resolve()
    dataset_dir = Path(dataset_root).resolve()

    yaml_data = {
        "path": dataset_dir.as_posix(),
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "nc": len(classes),
        "names": {i: name for i, name in enumerate(classes)},
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        yaml.dump(yaml_data, f, sort_keys=False, default_flow_style=False)

    print(f"[OK] Archivo data.yaml generado con exito en: {output_path}")
    print(f"     Clases configuradas ({len(classes)}): {', '.join(classes)}")
    return output_path


def verify_dataset_structure(data_yaml_path):
    """
    Verifica que el archivo data.yaml y las carpetas de imagenes existan
    y contengan datos antes de iniciar el entrenamiento.
    """
    yaml_file = Path(data_yaml_path).resolve()
    if not yaml_file.exists():
        print(f"[ERROR] No se encontro el archivo de configuracion: {yaml_file}")
        print("        Puede generarlo ejecutando: python train_custom_model.py --gen-yaml")
        return False

    with open(yaml_file, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    root_path = Path(config.get("path", yaml_file.parent))
    train_rel = config.get("train", "images/train")
    val_rel = config.get("val", "images/val")

    train_path = (root_path / train_rel).resolve() if not Path(train_rel).is_absolute() else Path(train_rel)
    val_path = (root_path / val_rel).resolve() if not Path(val_rel).is_absolute() else Path(val_rel)

    print("----------------------------------------------------------------------")
    print(f"[*] Verificando rutas del dataset definidas en: {yaml_file.name}")
    print(f"    - Directorio raiz:  {root_path}")
    print(f"    - Imagenes train:   {train_path}")
    print(f"    - Imagenes val:     {val_path}")

    train_ok = train_path.exists()
    val_ok = val_path.exists()

    train_count = len(list(train_path.glob("*.jpg")) + list(train_path.glob("*.png"))) if train_ok else 0
    val_count = len(list(val_path.glob("*.jpg")) + list(val_path.glob("*.png"))) if val_ok else 0

    print(f"    - Muestras train encontradas: {train_count}")
    print(f"    - Muestras val encontradas:   {val_count}")
    print("----------------------------------------------------------------------")

    if not train_ok or train_count == 0:
        print("[ADVERTENCIA] No se detectaron imagenes en la ruta de entrenamiento.")
        print("              Asegurese de organizar sus imagenes y etiquetas en dataset/images/train y dataset/labels/train.")
    return True


def check_system_environment():
    """
    Inspecciona el entorno de ejecucion (CUDA, GPU, CPU, versiones de PyTorch).
    """
    cuda_available = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if cuda_available else "CPU (Sin GPU dedicada)"
    device_count = torch.cuda.device_count() if cuda_available else 0

    print("======================================================================")
    print("            VisionPlanification - Diagnostico de Hardware             ")
    print("======================================================================")
    print(f"  PyTorch Version:     {torch.__version__}")
    print(f"  Aceleracion CUDA:    {'DISPONIBLE' if cuda_available else 'NO DISPONIBLE'}")
    print(f"  Dispositivo activo:  {device_name} (Total GPUs: {device_count})")
    if cuda_available:
        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        print(f"  Memoria VRAM:        {vram_gb:.2f} GB")
    print("======================================================================")
    return "0" if cuda_available else "cpu"


def export_model_artifacts(trained_model, export_formats, imgsz=640):
    """
    Exporta el modelo entrenado a los formatos solicitados (TFLite, ONNX, etc.).
    """
    if not export_formats:
        return

    print()
    print("[*] Iniciando pipeline de exportacion de artefactos...")
    for fmt in export_formats:
        fmt = fmt.strip().lower()
        print(f"    --> Exportando a formato: {fmt.upper()} (imgsz={imgsz})...")
        try:
            if fmt == "tflite":
                # Exportacion a TFLite optimizada para dispositivos moviles
                exported_path = trained_model.export(format="tflite", imgsz=imgsz, int8=False)
                print(f"    [OK] Modelo TFLite generado en: {exported_path}")
            elif fmt == "onnx":
                # Exportacion a ONNX estandar
                exported_path = trained_model.export(format="onnx", imgsz=imgsz, dynamic=False, simplify=True)
                print(f"    [OK] Modelo ONNX generado en: {exported_path}")
            elif fmt in ("saved_model", "tfjs"):
                # Exportacion a TensorFlow SavedModel
                exported_path = trained_model.export(format="saved_model", imgsz=imgsz)
                print(f"    [OK] Modelo SavedModel generado en: {exported_path}")
            else:
                exported_path = trained_model.export(format=fmt, imgsz=imgsz)
                print(f"    [OK] Modelo ({fmt}) generado en: {exported_path}")
        except Exception as e:
            print(f"    [AVISO] No se pudo exportar a {fmt}: {e}")
            print("            Puede requerir paquetes adicionales como onnx, onnxruntime o tensorflow.")


def train_custom_model(
    data_path="data.yaml",
    model_weights="yolov8n.pt",
    epochs=100,
    imgsz=640,
    batch=16,
    device=None,
    project="runs/train",
    name="office_custom_yolov8n",
    workers=2,
    export_formats=None,
):
    """
    Funcion principal de entrenamiento y evaluacion usando Ultralytics YOLOv8.
    """
    # 1. Diagnostico del entorno y seleccion de dispositivo
    auto_device = check_system_environment()
    chosen_device = device if device is not None else auto_device

    # 2. Validacion de datos
    data_yaml_path = Path(data_path).resolve()
    if not data_yaml_path.exists():
        print(f"[!] Archivo {data_yaml_path} no encontrado. Creando plantilla por defecto...")
        generate_data_yaml_template(output_path=data_yaml_path)

    verify_dataset_structure(data_yaml_path)

    # 3. Carga del modelo base preentrenado (transfer learning)
    print()
    print(f"[*] Cargando arquitectura base y pesos preentrenados: {model_weights}")
    model = YOLO(model_weights)

    # 4. Hiperparametros y configuracion del entrenamiento
    print()
    print("[*] Iniciando entrenamiento:")
    print(f"    - Epocas:       {epochs}")
    print(f"    - Resolucion:   {imgsz}x{imgsz}")
    print(f"    - Batch Size:   {batch}")
    print(f"    - Dispositivo:  {chosen_device}")
    print(f"    - Directorio:   {project}/{name}")
    print(f"    - DataLoaders:  {workers} workers")

    # Ejecucion del entrenamiento
    train_results = model.train(
        data=str(data_yaml_path),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        device=chosen_device,
        project=project,
        name=name,
        workers=workers,
        patience=25,        # Early stopping si no mejora en 25 epocas
        save=True,          # Guardar mejores pesos (best.pt) y ultimo (last.pt)
        save_period=10,     # Guardar checkpoint cada 10 epocas
        plots=True,         # Generar graficas de perdida y matriz de confusion
        optimizer="auto",
        lr0=0.01,
        lrf=0.01,
        mosaic=1.0,         # Data augmentation: Mosaic
        degrees=10.0,       # Rotacion leve (+/- 10 grados)
        fliplr=0.5,         # Volteo horizontal 50%
        flipud=0.0,         # Desactivar volteo vertical para mobiliario
        exist_ok=True,
    )

    print()
    print("[OK] Entrenamiento completado con exito.")

    # 5. Validacion formal sobre el conjunto de validacion
    print()
    print("[*] Ejecutando evaluacion de metricas sobre el conjunto de validacion...")
    val_results = model.val()

    print()
    print("======================================================================")
    print("                  Resumen de Metricas de Validacion                   ")
    print("======================================================================")
    try:
        metrics_dict = val_results.results_dict
        print(f"  mAP @ 0.50:       {metrics_dict.get('metrics/mAP50(B)', 0.0):.4f}")
        print(f"  mAP @ 0.50:0.95:  {metrics_dict.get('metrics/mAP50-95(B)', 0.0):.4f}")
        print(f"  Precision Media:  {metrics_dict.get('metrics/precision(B)', 0.0):.4f}")
        print(f"  Recall Medio:     {metrics_dict.get('metrics/recall(B)', 0.0):.4f}")
    except Exception:
        print("  Metricas calculadas y almacenadas en el directorio de resultados.")
    print("======================================================================")

    # 6. Exportacion automatica si fue solicitada
    if export_formats:
        export_model_artifacts(model, export_formats, imgsz=imgsz)

    best_weights = Path(project) / name / "weights" / "best.pt"
    if best_weights.exists():
        print()
        print("[FINALIZADO] Pesos optimos guardados en:")
        print(f"  -> {best_weights.resolve()}")
    return model, train_results


def parse_arguments():
    """
    Configura y procesa los argumentos de la linea de comandos.
    """
    parser = argparse.ArgumentParser(
        description="Entrenamiento de modelo YOLOv8 para deteccion de mobiliario de oficina (VisionPlanification)"
    )
    parser.add_argument(
        "--data",
        type=str,
        default="data.yaml",
        help="Ruta al archivo data.yaml de configuracion del dataset (default: data.yaml)",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8n.pt",
        help="Modelo base preentrenado de Ultralytics (default: yolov8n.pt)",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=100,
        help="Numero maximo de epocas de entrenamiento (default: 100)",
    )
    parser.add_argument(
        "--imgsz",
        "--img-size",
        type=int,
        default=640,
        help="Tamano de imagen cuadrada en pixeles (default: 640)",
    )
    parser.add_argument(
        "--batch",
        "--batch-size",
        type=int,
        default=16,
        help="Tamano de batch para el entrenamiento (default: 16)",
    )
    parser.add_argument(
        "--device",
        type=str,
        default=None,
        help="Dispositivo de computo ('0' para GPU, 'cpu' para CPU, default: auto)",
    )
    parser.add_argument(
        "--project",
        type=str,
        default="runs/train",
        help="Directorio de guardado de los experimentos (default: runs/train)",
    )
    parser.add_argument(
        "--name",
        type=str,
        default="office_custom_yolov8n",
        help="Nombre de la corrida de entrenamiento (default: office_custom_yolov8n)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=2,
        help="Numero de trabajadores para carga de datos (default: 2 para estabilidad en Windows)",
    )
    parser.add_argument(
        "--export",
        nargs="+",
        default=["tflite", "onnx"],
        help="Formatos a exportar tras entrenar: tflite onnx saved_model (default: tflite onnx)",
    )
    parser.add_argument(
        "--gen-yaml",
        action="store_true",
        help="Genera un archivo data.yaml de plantilla y finaliza sin entrenar",
    )
    return parser.parse_args()


if __name__ == "__main__":
    # Proteccion indispensable para multiprocessing en Windows
    args = parse_arguments()

    if args.gen_yaml:
        generate_data_yaml_template(output_path=args.data)
        sys.exit(0)

    try:
        train_custom_model(
            data_path=args.data,
            model_weights=args.model,
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch=args.batch,
            device=args.device,
            project=args.project,
            name=args.name,
            workers=args.workers,
            export_formats=args.export,
        )
    except KeyboardInterrupt:
        print()
        print("[!] Entrenamiento interrumpido por el usuario.")
        sys.exit(1)
    except Exception as ex:
        print()
        print(f"[ERROR CRITICO] Fallo en el entrenamiento: {ex}")
        sys.exit(1)
`);

// 3. training/collect_frames.py
writeFile('training/collect_frames.py', `# -*- coding: utf-8 -*-
"""
VisionPlanification - Recoleccion Rapida de Fotogramas para Entrenamiento
Permite abrir la camara web, seleccionar interactivamente la clase de objeto
y capturar fotogramas individuales o rafagas con marcas de tiempo.
"""

import argparse
import datetime
import os
import sys
import time
from pathlib import Path
import cv2

# Catalogo oficial de clases personalizadas
CUSTOM_CLASSES = [
    "cajonera",
    "casco_de_moto",
    "mochila",
    "pantalla",
    "portatil",
    "silla_oficina",
    "mesa_escritorio",
    "separador",
]


def parse_arguments():
    """
    Procesa argumentos de linea de comandos para la captura.
    """
    parser = argparse.ArgumentParser(
        description="Capturador de fotogramas con webcam para dataset de VisionPlanification"
    )
    parser.add_argument(
        "--class-name",
        "-c",
        type=str,
        default=None,
        help="Nombre de la clase a capturar (si se omite, se solicita interactivamente)",
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        type=str,
        default="dataset/raw_images",
        help="Directorio raiz donde guardar las imagenes capturadas (default: dataset/raw_images)",
    )
    parser.add_argument(
        "--camera-id",
        "-i",
        type=int,
        default=0,
        help="Indice de la camara web (default: 0)",
    )
    parser.add_argument(
        "--width",
        type=int,
        default=1280,
        help="Ancho deseado de la captura (default: 1280)",
    )
    parser.add_argument(
        "--height",
        type=int,
        default=720,
        help="Alto deseado de la captura (default: 720)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.2,
        help="Retardo en segundos entre capturas en modo rafaga (default: 0.2)",
    )
    return parser.parse_args()


def select_class_interactive():
    """
    Presenta un menu en consola para seleccionar comodamente la clase a capturar.
    """
    print()
    print("=" * 65)
    print("      VisionPlanification - Seleccion de Clase de Mobiliario      ")
    print("=" * 65)
    for idx, name in enumerate(CUSTOM_CLASSES, 1):
        print(f"  [{idx}] {name}")
    print("  [9] Otra clase personalizada...")
    print("=" * 65)

    while True:
        try:
            choice = input("Seleccione el numero de clase [1-9]: ").strip()
            if not choice:
                continue
            choice_num = int(choice)
            if 1 <= choice_num <= len(CUSTOM_CLASSES):
                selected = CUSTOM_CLASSES[choice_num - 1]
                print(f"[*] Clase seleccionada: '{selected}'")
                return selected
            elif choice_num == 9:
                custom_name = input("Ingrese el nombre de la nueva clase: ").strip().lower().replace(" ", "_")
                if custom_name:
                    print(f"[*] Clase personalizada: '{custom_name}'")
                    return custom_name
            else:
                print("[!] Opcion no valida. Elija un numero entre 1 y 9.")
        except ValueError:
            print("[!] Por favor ingrese un numero entero.")
        except (KeyboardInterrupt, EOFError):
            print()
            print("Operacion cancelada.")
            sys.exit(0)


def setup_camera(camera_id=0, width=1280, height=720):
    """
    Inicializa la camara web aplicando backend DirectShow en Windows para baja latencia.
    """
    # En Windows, cv2.CAP_DSHOW previene congelaciones y acelera la apertura de la webcam
    if sys.platform.startswith("win"):
        cap = cv2.VideoCapture(camera_id, cv2.CAP_DSHOW)
        if not cap.isOpened():
            cap = cv2.VideoCapture(camera_id)
    else:
        cap = cv2.VideoCapture(camera_id)

    if not cap.isOpened():
        print(f"[ERROR] No se pudo abrir la camara con ID {camera_id}.")
        print("        Verifique que ningun otro programa la este utilizando.")
        return None

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"[OK] Camara iniciada exitosamente ({actual_w}x{actual_h} px)")
    return cap


def save_frame(frame, output_dir, class_name, counter):
    """
    Guarda el fotograma en formato JPEG de alta calidad con marca de tiempo.
    """
    target_dir = Path(output_dir) / class_name
    target_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:19]
    filename = f"{class_name}_{timestamp}_{counter:04d}.jpg"
    full_path = target_dir / filename

    # Guardar con calidad JPEG 95 para preservar detalles de texturas
    success = cv2.imwrite(str(full_path), frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
    if success:
        return full_path
    return None


def draw_hud(frame, class_name, captured_count, fps, burst_active=False):
    """
    Dibuja una interfaz visual semitransparente (HUD) sobre el fotograma con informacion util.
    """
    h, w, _ = frame.shape
    overlay = frame.copy()

    # Barra superior oscura
    cv2.rectangle(overlay, (0, 0), (w, 55), (20, 20, 25), -1)
    # Barra inferior oscura para instrucciones
    cv2.rectangle(overlay, (0, h - 35), (w, h), (20, 20, 25), -1)

    # Fusionar con transparencia
    alpha = 0.75
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

    # Texto cabecera: Clase actual y contador
    header_text = f"CLASE ACTIVA: [{class_name.upper()}]  |  Capturas: {captured_count}  |  FPS: {fps:.1f}"
    status_color = (0, 240, 255) if not burst_active else (0, 80, 255)
    cv2.putText(frame, header_text, (15, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2, cv2.LINE_AA)

    if burst_active:
        cv2.putText(frame, "RAFAGA ACTIVA", (w - 220, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)

    # Texto inferior: Atajos de teclado
    footer_text = "[C] Capturar  |  [B] Rafaga (5x)  |  [S] Cambiar Clase  |  [Q/ESC] Salir"
    cv2.putText(frame, footer_text, (15, h - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (220, 220, 220), 1, cv2.LINE_AA)


def run_collector(args):
    """
    Bucle principal de visualizacion y captura interactiva.
    """
    class_name = args.class_name
    if not class_name:
        class_name = select_class_interactive()

    cap = setup_camera(args.camera_id, args.width, args.height)
    if cap is None:
        sys.exit(1)

    window_name = "VisionPlanification - Colector de Imagenes (Webcam)"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

    captured_summary = {}
    current_class_count = 0
    total_counter = 0

    fps = 0.0
    prev_time = time.time()
    flash_frames = 0  # Para simular efecto visual de flash al capturar

    print()
    print("[*] Iniciando vista previa en vivo...")
    print("    Presione 'c' para capturar una foto individual.")
    print("    Presione 'b' para tomar 5 fotos en rafaga.")
    print("    Presione 's' para cambiar de clase sin salir.")
    print("    Presione 'q' o ESC para finalizar la sesion.")

    try:
        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                print("[!] Error leyendo fotograma de la camara.")
                time.sleep(0.05)
                continue

            # Calculo de FPS
            curr_time = time.time()
            dt = curr_time - prev_time
            if dt > 0:
                fps = 0.9 * fps + 0.1 * (1.0 / dt)
            prev_time = curr_time

            # Copia limpia para guardar sin las letras del HUD
            clean_frame = frame.copy()

            # Destello visual de flash si se tomo una foto recientemente
            if flash_frames > 0:
                cv2.rectangle(frame, (0, 0), (frame.shape[1], frame.shape[0]), (255, 255, 255), -1)
                flash_frames -= 1
            else:
                draw_hud(frame, class_name, current_class_count, fps, burst_active=False)

            cv2.imshow(window_name, frame)

            key = cv2.waitKey(1) & 0xFF

            # [Q] o ESC: Salir
            if key in (ord('q'), ord('Q'), 27):
                print()
                print("[*] Finalizando sesion de recoleccion...")
                break

            # [C]: Captura individual
            elif key in (ord('c'), ord('C')):
                total_counter += 1
                current_class_count += 1
                captured_summary[class_name] = captured_summary.get(class_name, 0) + 1
                saved_path = save_frame(clean_frame, args.output_dir, class_name, total_counter)
                flash_frames = 2
                print(f"[CAPTURA {current_class_count}] Guardada: {saved_path.name}")

            # [B]: Rafaga de 5 capturas
            elif key in (ord('b'), ord('B')):
                print(f"[*] Tomando rafaga de 5 fotos para '{class_name}'...")
                for burst_idx in range(5):
                    # Leer frame fresco
                    ret_b, burst_frame = cap.read()
                    if ret_b and burst_frame is not None:
                        total_counter += 1
                        current_class_count += 1
                        captured_summary[class_name] = captured_summary.get(class_name, 0) + 1
                        saved_path = save_frame(burst_frame, args.output_dir, class_name, total_counter)
                        print(f"    - Rafaga ({burst_idx + 1}/5): {saved_path.name}")
                    time.sleep(args.delay)
                flash_frames = 3

            # [S]: Cambiar clase en caliente
            elif key in (ord('s'), ord('S')):
                cv2.destroyWindow(window_name)
                class_name = select_class_interactive()
                current_class_count = captured_summary.get(class_name, 0)
                cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

    finally:
        cap.release()
        cv2.destroyAllWindows()

    print()
    print("======================================================================")
    print("                Resumen de Fotogramas Capturados                      ")
    print("======================================================================")
    total_imgs = sum(captured_summary.values())
    if captured_summary:
        for cls, count in captured_summary.items():
            print(f"  - Clase '{cls}': {count} imagenes guardadas")
        print(f"  Total general: {total_imgs} imagenes")
        print(f"  Directorio:    {Path(args.output_dir).resolve()}")
    else:
        print("  No se registraron capturas en esta sesion.")
    print("======================================================================")


if __name__ == "__main__":
    args = parse_arguments()
    run_collector(args)
`);

// 4. training/export_to_tfjs.py
writeFile('training/export_to_tfjs.py', `# -*- coding: utf-8 -*-
"""
VisionPlanification - Pipeline de Exportacion a TensorFlow.js y TFLite
Convierte modelos YOLOv8 entrenados (.pt) al formato tfjs_graph_model
para ejecucion en navegador web y genera metadatos para el simulador.
"""

import argparse
import datetime
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from ultralytics import YOLO


CUSTOM_CLASSES = [
    "cajonera",
    "casco_de_moto",
    "mochila",
    "pantalla",
    "portatil",
    "silla_oficina",
    "mesa_escritorio",
    "separador",
]


def parse_arguments():
    """
    Configura y procesa los argumentos para la exportacion.
    """
    parser = argparse.ArgumentParser(
        description="Exportacion de modelo YOLOv8 a TensorFlow.js y Android TFLite (VisionPlanification)"
    )
    parser.add_argument(
        "--weights",
        type=str,
        default="runs/train/office_custom_yolov8n/weights/best.pt",
        help="Ruta al archivo de pesos PyTorch .pt entrenado (default: runs/train/office_custom_yolov8n/weights/best.pt)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="../web-simulator/models/custom_yolov8n_tfjs",
        help="Directorio destino para el modelo TensorFlow.js (default: ../web-simulator/models/custom_yolov8n_tfjs)",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Dimension de entrada del modelo en pixeles (default: 640)",
    )
    parser.add_argument(
        "--quantize",
        action="store_true",
        help="Aplica cuantizacion uint8 a los pesos TF.js para reducir tamano en navegador",
    )
    parser.add_argument(
        "--copy-android",
        action="store_true",
        help="Exporta tambien a TFLite y lo copia a app/src/main/assets/models/spatial_remodeler_quant.tflite",
    )
    return parser.parse_args()


def find_weights_file(weights_path):
    """
    Localiza el archivo de pesos .pt o busca alternativas habituales.
    """
    p = Path(weights_path).resolve()
    if p.exists() and p.is_file():
        return p

    # Rutas alternativas comunes
    candidates = [
        Path("runs/train/office_custom_yolov8n/weights/best.pt"),
        Path("runs/detect/train/weights/best.pt"),
        Path("weights/best.pt"),
        Path("yolov8n.pt"),
    ]
    for cand in candidates:
        if cand.exists():
            print(f"[AVISO] '{weights_path}' no encontrado. Utilizando candidato detectado: '{cand.resolve()}'")
            return cand.resolve()

    print(f"[ERROR] No se pudo encontrar el archivo de pesos: {weights_path}")
    print("        Asegurese de haber ejecutado previamente train_custom_model.py")
    return None


def export_to_saved_model(weights_path, imgsz=640):
    """
    Usa la API de Ultralytics para exportar el modelo PyTorch a TensorFlow SavedModel.
    """
    print()
    print(f"[1/3] Exportando pesos PyTorch a TensorFlow SavedModel (imgsz={imgsz})...")
    model = YOLO(str(weights_path))

    # Ultralytics exporta a saved_model creando una carpeta homonima con sufijo _saved_model
    try:
        exported_path = model.export(format="saved_model", imgsz=imgsz, keras=False)
        saved_model_dir = Path(exported_path)
        if saved_model_dir.exists():
            print(f"      [OK] SavedModel generado exitosamente en: {saved_model_dir}")
            return saved_model_dir
    except Exception as e:
        print(f"[ERROR] Fallo al exportar a SavedModel desde Ultralytics: {e}")

    # Busqueda heuristica si el retorno no fue directo
    possible_dir = weights_path.parent / f"{weights_path.stem}_saved_model"
    if possible_dir.exists():
        return possible_dir

    return None


def convert_saved_model_to_tfjs(saved_model_dir, output_dir, quantize=False):
    """
    Convierte el directorio SavedModel a tfjs_graph_model mediante tensorflowjs_converter.
    """
    print()
    print("[2/3] Convirtiendo SavedModel a TensorFlow.js Graph Model...")
    output_path = Path(output_dir).resolve()
    output_path.mkdir(parents=True, exist_ok=True)

    cmd = [
        "tensorflowjs_converter",
        "--input_format=tf_saved_model",
        "--output_format=tfjs_graph_model",
        "--signature_name=serving_default",
        "--saved_model_tags=serve",
    ]

    if quantize:
        cmd.extend(["--quantize_uint8=*"])

    cmd.extend([str(saved_model_dir), str(output_path)])

    print(f"      Ejecutando comando: {' '.join(cmd)}")

    # Intentar ejecutar como comando CLI
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print("      [OK] Conversion completada con exito.")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"      [AVISO] No se pudo ejecutar 'tensorflowjs_converter' directamente en PATH: {e}")
        print("      Intentando via modulo Python: python -m tensorflowjs.converters.converter ...")

    # Intento alternativo via modulo Python
    cmd_python = [sys.executable, "-m", "tensorflowjs.converters.converter"] + cmd[1:]
    try:
        result = subprocess.run(cmd_python, capture_output=True, text=True, check=True)
        print("      [OK] Conversion completada exitosamente via modulo Python.")
        return True
    except Exception as py_err:
        print(f"      [ERROR] No se pudo completar la conversion a TF.js: {py_err}")
        print("              Para solucionarlo, instale tensorflowjs con: pip install tensorflowjs")
        return False


def generate_metadata_file(output_dir, imgsz=640, classes=None):
    """
    Crea un archivo model_info.json con la definicion de clases y parametros
    para que el simulador web (web-simulator) cargue e interprete la salida.
    """
    if classes is None:
        classes = CUSTOM_CLASSES

    meta_path = Path(output_dir) / "model_info.json"
    metadata = {
        "model_name": "VisionPlanification Custom Office YOLOv8n",
        "format": "tfjs_graph_model",
        "input_shape": [1, imgsz, imgsz, 3],
        "image_size": imgsz,
        "classes": {idx: name for idx, name in enumerate(classes)},
        "class_list": classes,
        "num_classes": len(classes),
        "confidence_threshold": 0.35,
        "iou_threshold": 0.45,
        "created_at": datetime.datetime.now().isoformat(),
        "framework": "Ultralytics YOLOv8 -> TFJS",
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"      [OK] Metadatos del modelo generados en: {meta_path}")


def export_and_copy_tflite_android(weights_path, imgsz=640):
    """
    Exporta a formato TFLite y copia el archivo directamente a la carpeta de assets
    de la aplicacion Android (app/src/main/assets/models/spatial_remodeler_quant.tflite).
    """
    print()
    print("[EXTRA] Exportando modelo a TFLite para aplicacion Android...")
    model = YOLO(str(weights_path))

    try:
        tflite_file = model.export(format="tflite", imgsz=imgsz, int8=False)
        tflite_path = Path(tflite_file)
        if not tflite_path.exists():
            # Buscar archivo con sufijo .tflite
            candidates = list(weights_path.parent.glob("*.tflite"))
            if candidates:
                tflite_path = candidates[0]

        print(f"      [OK] TFLite generado: {tflite_path}")

        # Ruta destino en modulo Android
        android_assets_dir = Path(__file__).resolve().parent.parent / "app" / "src" / "main" / "assets" / "models"
        android_assets_dir.mkdir(parents=True, exist_ok=True)
        target_dest = android_assets_dir / "spatial_remodeler_quant.tflite"

        shutil.copy2(tflite_path, target_dest)
        print("[OK] Copiado a assets de Android:")
        print(f"     -> {target_dest}")
    except Exception as e:
        print(f"      [AVISO] No se pudo exportar o copiar a Android assets: {e}")


def main():
    args = parse_arguments()

    print("======================================================================")
    print("        VisionPlanification - Exportador a Web Simulator & AR         ")
    print("======================================================================")

    weights_file = find_weights_file(args.weights)
    if not weights_file:
        sys.exit(1)

    print(f"[*] Modelo fuente: {weights_file}")
    print(f"[*] Destino TF.js: {Path(args.output_dir).resolve()}")

    # 1. Exportar PyTorch a SavedModel
    saved_model_path = export_to_saved_model(weights_file, imgsz=args.imgsz)
    if not saved_model_path:
        print("[ERROR] No se pudo generar el formato SavedModel intermedio.")
        sys.exit(1)

    # 2. Convertir SavedModel a TensorFlow.js Graph Model
    success = convert_saved_model_to_tfjs(
        saved_model_path,
        args.output_dir,
        quantize=args.quantize,
    )

    # 3. Crear metadatos JSON
    generate_metadata_file(args.output_dir, imgsz=args.imgsz)

    # 4. Exportar y copiar TFLite a Android si fue solicitado
    if args.copy_android:
        export_and_copy_tflite_android(weights_file, imgsz=args.imgsz)

    print()
    print("======================================================================")
    print("[FINALIZADO CON EXITO] Modelo listo para ser consumido en:")
    print(f"  - Web Simulator: {Path(args.output_dir).resolve()}")
    print("======================================================================")


if __name__ == "__main__":
    main()
`);

// 5. training/data.yaml
writeFile('training/data.yaml', `# ==============================================================================
# VisionPlanification - Configuracion de Dataset para YOLOv8
# Deteccion de Mobiliario y Objetos de Oficina para Remodelacion Espacial
# ==============================================================================

# Ruta raiz del dataset (puede ser relativa al archivo data.yaml o absoluta)
path: ./dataset

# Subrutas relativas a 'path' para las particiones de entrenamiento, validacion y test
train: images/train
val: images/val
test: images/test # Opcional: evaluacion final

# Numero total de clases personalizadas
nc: 8

# Mapeo de identificadores y nombres de clases
names:
  0: cajonera
  1: casco_de_moto
  2: mochila
  3: pantalla
  4: portatil
  5: silla_oficina
  6: mesa_escritorio
  7: separador
`);

// 6. training/requirements.txt
writeFile('training/requirements.txt', `# ==============================================================================
# VisionPlanification - Dependencias de Entrenamiento y Exportacion
# ==============================================================================

# Framework de deteccion de objetos y computer vision
ultralytics>=8.1.0

# Deep Learning con PyTorch (Compatible con CPU y CUDA en Windows)
torch>=2.0.0
torchvision>=0.15.0

# Procesamiento de imagen y vision artificial
opencv-python>=4.8.0
pillow>=10.0.0
numpy>=1.23.0,<2.0.0

# Formatos de configuracion, datos y metricas
pyyaml>=6.0
tqdm>=4.66.0
matplotlib>=3.7.0
pandas>=2.0.0

# Exportacion a formatos ONNX, TensorFlow, TFLite y TensorFlow.js
onnx>=1.15.0
onnxruntime>=1.16.0
tensorflow>=2.15.0,<2.16.0
tensorflowjs>=4.17.0
`);
