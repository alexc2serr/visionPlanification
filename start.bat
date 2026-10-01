@echo off
title VisionPlanification - Launcher
echo ========================================================
echo   VisionPlanification - Sistema de Deteccion Espacial
echo ========================================================
echo.
echo Seleccione el modo de ejecucion:
echo.
echo   [1] Webcam con YOLOv8 Directo (Maxima precision en vivo)
echo   [2] Simulador Web con Stitch HUD (Navegador localhost:3000)
echo   [3] Descargar imagenes de Google y Entrenar Modelo
echo.
set /p opt="Opcion (1/2/3, por defecto 1): "

if "%opt%"=="" set opt=1

if "%opt%"=="1" (
    echo.
    echo ========================================================
    echo   Iniciando Webcam con YOLOv8 en Tiempo Real...
    echo   (Presione 'q' sobre la ventana de la camara para salir)
    echo ========================================================
    echo.
    if exist "C:\VPlan\.venv\Scripts\yolo.exe" (
        C:\VPlan\.venv\Scripts\yolo.exe predict model=yolov8n.pt source=0 show=True conf=0.25
    ) else (
        if not exist ".venv\Scripts\yolo.exe" (
            echo Configurando entorno virtual local por primera vez...
            python -m venv .venv
            .\.venv\Scripts\python.exe -m pip install --upgrade pip
            .\.venv\Scripts\python.exe -m pip install ultralytics opencv-python Pillow
        )
        .\.venv\Scripts\yolo.exe predict model=yolov8n.pt source=0 show=True conf=0.25
    )
    pause
    exit /b
)

if "%opt%"=="2" (
    echo.
    echo ========================================================
    echo   Iniciando Simulador Web con Stitch HUD...
    echo ========================================================
    echo Abriendo http://localhost:3000...
    start http://localhost:3000
    node web-simulator/server.js
    pause
    exit /b
)

if "%opt%"=="3" (
    echo.
    echo ========================================================
    echo   Pipeline de Descarga Google Open Images y Entrenamiento
    echo ========================================================
    echo.
    if exist "C:\VPlan\.venv\Scripts\python.exe" (
        set PY=C:\VPlan\.venv\Scripts\python.exe
    ) else (
        if not exist ".venv\Scripts\python.exe" (
            python -m venv .venv
            .\.venv\Scripts\python.exe -m pip install ultralytics fiftyone Pillow opencv-python
        )
        set PY=.\.venv\Scripts\python.exe
    )
    %PY% training/download_open_images.py --max-samples 100
    %PY% training/split_dataset.py
    %PY% -c "from ultralytics import YOLO; m = YOLO('yolov8n.pt'); m.train(data='dataset/yolo_dataset/dataset.yaml', epochs=20, imgsz=416, batch=8, project='runs', name='custom')"
    pause
    exit /b
)