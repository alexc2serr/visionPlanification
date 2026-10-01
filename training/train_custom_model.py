# -*- coding: utf-8 -*-
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
