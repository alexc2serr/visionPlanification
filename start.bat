@echo off
setlocal EnableDelayedExpansion
title VisionPlanification - Launcher
cd /d "%~dp0"

echo ========================================================
echo   VisionPlanification - Sistema de Deteccion Espacial
echo ========================================================
echo.
echo Seleccione el modo de ejecucion:
echo.
echo   [1] Webcam con YOLOv8 Directo (Ventana nativa Python)
echo   [2] Simulador Web con Stitch HUD (Navegador localhost:3000)
echo   [3] Descargar imagenes de Google y Entrenar Modelo
echo.

set "opt="
set /p opt="Opcion (1/2/3, por defecto 1): "
if "!opt!"=="" set "opt=1"

rem Limpiar espacios en blanco accidentales
set "opt=!opt: =!"

if "!opt!"=="1" goto MODO_1
if "!opt!"=="2" goto MODO_2
if "!opt!"=="3" goto MODO_3

echo Opcion no reconocida, iniciando opcion 1 por defecto...
goto MODO_1

:MODO_1
echo.
echo ========================================================
echo   [MODO 1] Iniciando Webcam con YOLOv8 Directo...
echo   (Presione 'q' sobre la ventana de la camara para salir)
echo ========================================================
echo.
if exist "C:\VPlan\.venv\Scripts\yolo.exe" (
    "C:\VPlan\.venv\Scripts\yolo.exe" predict model=yolov8n.pt source=0 show=True conf=0.25
) else (
    if not exist ".venv\Scripts\yolo.exe" (
        echo Configurando entorno virtual local...
        python -m venv .venv
        .\.venv\Scripts\python.exe -m pip install --upgrade pip
        .\.venv\Scripts\python.exe -m pip install ultralytics opencv-python Pillow
    )
    .\.venv\Scripts\yolo.exe predict model=yolov8n.pt source=0 show=True conf=0.25
)
pause
goto :EOF

:MODO_2
echo.
echo ========================================================
echo   [MODO 2] Iniciando Servidor Node.js + Stitch HUD...
echo ========================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js no esta instalado o no esta en el PATH.
    echo Por favor instale Node.js desde https://nodejs.org
    pause
    goto :EOF
)

echo Abriendo navegador en http://localhost:3000...
start http://localhost:3000
echo Ejecutando servidor Node.js (Presione Ctrl+C para detener)...
node web-simulator/server.js
pause
goto :EOF

:MODO_3
echo.
echo ========================================================
echo   [MODO 3] Descarga Google Open Images y Entrenamiento...
echo ========================================================
echo.
set "PY="
if exist "C:\VPlan\.venv\Scripts\python.exe" (
    set "PY=C:\VPlan\.venv\Scripts\python.exe"
) else (
    if not exist ".venv\Scripts\python.exe" (
        python -m venv .venv
        .\.venv\Scripts\python.exe -m pip install ultralytics fiftyone Pillow opencv-python
    )
    set "PY=.\.venv\Scripts\python.exe"
)
!PY! training/download_open_images.py --max-samples 100
!PY! training/split_dataset.py
!PY! -c "from ultralytics import YOLO; m = YOLO('yolov8n.pt'); m.train(data='dataset/yolo_dataset/dataset.yaml', epochs=20, imgsz=416, batch=8, project='runs', name='custom')"
pause
goto :EOF