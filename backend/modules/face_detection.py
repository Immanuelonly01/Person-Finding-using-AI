import cv2
import insightface

class FaceDetector:
    def __init__(self, device='cpu'):
        """
        Initialize the face detector using InsightFace's RetinaFace model.
        """
        self.model = insightface.model_zoo.get_model('buffalo_l')
        self.model.prepare(ctx_id=0 if device != 'cpu' else -1)

    def detect_faces(self, image_bgr):
        """
        Detect faces in a given BGR image.

        Returns:
            List of detections, each containing:
            {
                'bbox': (x1, y1, x2, y2),
                'landmarks': np.array([...]),
                'score': float
            }
        """
        faces = self.model.get(image_bgr)
        detections = []

        for f in faces:
            box = list(map(int, f.bbox))
            detection = {
                "bbox": box,
                "landmarks": f.landmark,
                "score": float(f.det_score)
            }
            detections.append(detection)
        return detections

    def draw_detections(self, image_bgr, detections):
        """
        Draw bounding boxes and confidence scores on the image.
        """
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            score = det['score']
            cv2.rectangle(image_bgr, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(image_bgr, f"{score:.2f}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        return image_bgr

