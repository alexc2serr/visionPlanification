import cv2
import time
from ultralytics import YOLO

model_path = r'C:\VPlan\runs\pilot_train\weights\best.pt'
print(f'Cargando modelo: {model_path}...')
model = YOLO(model_path)

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print('No se pudo acceder a la webcam 0, probando webcam 1...')
    cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print('Error: No se encontro webcam disponible.')
    exit(1)

print('=' * 60)
print('VISOR EN TIEMPO REAL ACTIVO')
print('Presiona la tecla Q o ESC sobre la ventana de video para salir.')
print('=' * 60)

prev_time = time.time()
while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Inferencia con el modelo entrenado
    results = model.predict(source=frame, conf=0.25, imgsz=416, verbose=False)
    annotated_frame = results[0].plot()

    # Calcular FPS
    curr_time = time.time()
    fps = 1.0 / (curr_time - prev_time + 1e-6)
    prev_time = curr_time

    cv2.putText(annotated_frame, f'VisionPlan YOLOv8 - FPS: {fps:.1f}', (15, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    cv2.imshow('VisionPlan - Deteccion Personalizada (Webcam)', annotated_frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q') or key == 27:
        break

cap.release()
cv2.destroyAllWindows()
