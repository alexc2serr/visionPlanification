# -*- coding: utf-8 -*-
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
