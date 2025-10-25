from ultralytics import YOLO
import cv2

# Load YOLOv8 face model
model = YOLO("yolov8n-face.pt")  # You can use yolov8s-face.pt for better accuracy

# Read image or use webcam
img = cv2.imread("test.jpg")

# Run detection
results = model(img)

# Display results
for r in results:
    boxes = r.boxes.xyxy
    for box in boxes:
        x1, y1, x2, y2 = map(int, box[:4])
        cv2.rectangle(img, (x1, y1), (x2, y2), (0,255,0), 2)

cv2.imshow("Face Detection", img)
cv2.waitKey(0)
cv2.destroyAllWindows()
