from ultralytics import YOLO
import numpy as np
import cv2

class FaceDetector:
    """Uses YOLOv8n (successor to YOLOv5s) for efficient face/person detection."""
    def __init__(self):
        try:
            # YOLOv8n is loaded from the internet/cache by ultralytics
            self.model = YOLO('yolov8n.pt') 
            self.model.conf = 0.5 # Confidence threshold
        except Exception as e:
            print(f"Error loading YOLO model: {e}")
            raise

    def detect_faces(self, image: np.ndarray):
        """
        Detects faces (by relying on the 'person' class 0 detection) and returns 
        cropped images and bounding boxes.
        """
        # Run inference, disabling verbose output
        results = self.model(image, verbose=False)[0] 
        faces_data = []

        for r in results.boxes:
            # Check for high confidence and class 0 (person)
            if int(r.cls[0]) == 0 and r.conf[0] > 0.6: 
                x1, y1, x2, y2 = map(int, r.xyxy[0]) 

                # Simple padding for robustness in embedding
                h, w, _ = image.shape
                pad_x, pad_y = int((x2 - x1) * 0.1), int((y2 - y1) * 0.1)
                x1, y1 = max(0, x1 - pad_x), max(0, y1 - pad_y)
                x2, y2 = min(w, x2 + pad_x), min(h, y2 + pad_y)

                cropped_face = image[y1:y2, x1:x2]
                
                # Filter out very small crops
                if cropped_face.shape[0] > 20 and cropped_face.shape[1] > 20:
                    faces_data.append({
                        'box': (x1, y1, x2, y2), 
                        'image': cropped_face
                    })
        return faces_data