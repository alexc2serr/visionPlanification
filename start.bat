@echo off
echo ========================================================
echo   VisionPlanification - Lanzador Rapido
echo ========================================================
echo.
echo Seleccione el modo de ejecucion:
echo   [1] Iniciar Simulador Web con Stitch HUD (Navegador)
echo   [2] Probar Deteccion en Tiempo Real con Webcam (Python YOLO)
echo   [3] Descargar imagenes de Google y Entrenar Modelo
echo.
set /p opt="Opcion (1/2/3, por defecto 1): "

if "%opt%"=="" set opt=1

if "%opt%"=="1" (
    echo Iniciando servidor en http://localhost:3000...
    start http://localhost:3000
    node web-simulator/server.js
    pause
    exit /b
)

if "%opt%"=="2" (
    echo Verificando entorno Python...
    if not exist "C:\VPlan\.venv\Scripts\python.exe" (
        echo Creando entorno virtual rapido en C:\VPlan...
        mkdir C:\VPlan 2>nul
        python -m venv C:\VPlan\.venv
        C:\VPlan\.venv\Scripts\python.exe -m pip install ultralytics opencv-python Pillow
    )
    echo Ejecutando visor de webcam...
    C:\VPlan\.venv\Scripts\python.exe training/run_webcam.py
    pause
    exit /b
)

if "%opt%"=="3" (
    echo Ejecutando descarga de Google Open Images y reentrenamiento...
    if not exist "C:\VPlan\.venv\Scripts\python.exe" (
        mkdir C:\VPlan 2>nul
        python -m venv C:\VPlan\.venv
        C:\VPlan\.venv\Scripts\python.exe -m pip install ultralytics fiftyone Pillow opencv-python
    )
    C:\VPlan\.venv\Scripts\python.exe training/download_open_images.py --max-samples 100
    C:\VPlan\.venv\Scripts\python.exe training/split_dataset.py
    C:\VPlan\.venv\Scripts\python.exe -c "from ultralytics import YOLO; m = YOLO('yolov8n.pt'); m.train(data=r'C:\VPlan\dataset\yolo_dataset\dataset.yaml', epochs=20, imgsz=416, batch=8, project=r'C:\VPlan\runs', name='custom')"
    pause
    exit /b
)
