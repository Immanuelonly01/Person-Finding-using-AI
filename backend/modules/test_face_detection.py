from modules.face_detection import FaceDetector
import cv2

detector = FaceDetector(device='cpu')
img = cv2.imread('reference_images/immanuel.jpg')

faces = detector.detect_faces(img)
print(f"Detected {len(faces)} faces")

annotated = detector.draw_detections(img, faces)
cv2.imshow("Detections", annotated)
cv2.waitKey(0)
cv2.destroyAllWindows()
