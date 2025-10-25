from ultralytics import YOLO
import cv2
import os

# --- Load YOLOv8 face detection model ---
model_path = os.path.join("modules", "models", "yolov8n-face.pt")
model = YOLO(model_path)  # or yolov8s-face.pt for better accuracy

# --- Choose mode ---
USE_WEBCAM = False  # set True for live webcam detection

if USE_WEBCAM:
    cap = cv2.VideoCapture(0)  # open webcam
    if not cap.isOpened():
        print("❌ Error: Cannot open webcam.")
        exit()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Run YOLO face detection
        results = model(frame)
        annotated_frame = results[0].plot()

        cv2.imshow("YOLOv8 Face Detection (Webcam)", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

else:
    # --- Image mode ---
    img_path = "test.jpg"  # update with your image path
    if not os.path.exists(img_path):
        print(f"❌ Error: Image '{img_path}' not found.")
        exit()

    img = cv2.imread(img_path)

    # Run YOLO face detection
    results = model(img)

    # Draw boxes on faces
    for r in results:
        boxes = r.boxes.xyxy
        for box in boxes:
            x1, y1, x2, y2 = map(int, box[:4])
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)

    cv2.imshow("YOLOv8 Face Detection", img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
