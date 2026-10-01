# -*- coding: utf-8 -*-
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
