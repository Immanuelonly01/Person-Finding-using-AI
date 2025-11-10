"""
High-Accuracy Face Recognition Pipeline using ArcFace (InsightFace) + YOLOv8s-Face
Falls back to MTCNN if YOLOv8s-Face is not available.
"""

import cv2
import numpy as np
import torch
from werkzeug.datastructures import FileStorage
import os

# Try to import InsightFace (ArcFace)
try:
    import insightface
    from insightface.app import FaceAnalysis
    INSIGHTFACE_AVAILABLE = True
except ImportError:
    INSIGHTFACE_AVAILABLE = False
    print("[WARN] InsightFace not available. Install with: pip install insightface onnxruntime onnxruntime-gpu")

# Try to import YOLOv8s-Face
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("[WARN] Ultralytics YOLO not available. Install with: pip install ultralytics")

# Fallback to MTCNN + FaceNet if ArcFace is not available
try:
    from facenet_pytorch import MTCNN, InceptionResnetV1
    MTCNN_AVAILABLE = True
except ImportError:
    MTCNN_AVAILABLE = False
    print("[WARN] FaceNet-PyTorch not available. Install with: pip install facenet-pytorch")


class FaceRecognitionPipeline:
    """
    High-Accuracy Face Recognition Pipeline using:
    - Detection: YOLOv8s-Face (primary) or MTCNN (fallback)
    - Embedding: ArcFace via InsightFace (primary) or FaceNet (fallback)
    
    ArcFace provides state-of-the-art accuracy for face recognition tasks.
    """

    def __init__(self, use_arcface: bool = True, use_yolo: bool = True):
        """
        Initialize the face recognition pipeline.
        
        Args:
            use_arcface: If True, use ArcFace (InsightFace). Falls back to FaceNet if unavailable.
            use_yolo: If True, use YOLOv8s-Face for detection. Falls back to MTCNN if unavailable.
        """
        self.device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
        print(f"🔧 Loading Face Recognition Pipeline on device: {self.device}...")
        
        self.use_arcface = use_arcface and INSIGHTFACE_AVAILABLE
        self.use_yolo = use_yolo and YOLO_AVAILABLE
        
        # Initialize ArcFace (InsightFace) - Primary Method
        if self.use_arcface:
            try:
                # Initialize InsightFace with ArcFace model
                # Using 'buffalo_l' for best accuracy (or 'buffalo_s' for faster inference)
                self.face_app = FaceAnalysis(
                    name='buffalo_l',  # Large model for best accuracy
                    providers=['CUDAExecutionProvider', 'CPUExecutionProvider'] if torch.cuda.is_available() else ['CPUExecutionProvider']
                )
                self.face_app.prepare(ctx_id=0 if torch.cuda.is_available() else -1, det_size=(640, 640))
                self.embedding_size = 512  # ArcFace produces 512-dimensional embeddings
                print("[OK] ArcFace (InsightFace) loaded successfully - SOTA accuracy!")
            except Exception as e:
                print(f"[WARN] Failed to load ArcFace: {e}. Falling back to FaceNet.")
                self.use_arcface = False
        
        # Initialize YOLOv8s-Face for detection - Primary Method
        if self.use_yolo:
            try:
                # Try to load YOLOv8s-Face model
                yolo_model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'yolov8n-face.pt')
                if os.path.exists(yolo_model_path):
                    self.yolo_model = YOLO(yolo_model_path)
                    print("[OK] YOLOv8s-Face loaded successfully!")
                else:
                    # Try to download or use default YOLOv8n
                    print("[WARN] YOLOv8s-Face model not found. Using YOLOv8n as fallback.")
                    self.yolo_model = YOLO('yolov8n.pt')  # General YOLOv8n (may not be face-specific)
                    self.use_yolo = False  # Disable if not face-specific
            except Exception as e:
                print(f"[WARN] Failed to load YOLOv8: {e}. Falling back to MTCNN.")
                self.use_yolo = False
        
        # Fallback: MTCNN + FaceNet
        if not self.use_arcface and MTCNN_AVAILABLE:
            print("📦 Using fallback: MTCNN + FaceNet")
            self.mtcnn = MTCNN(
                image_size=160,
                margin=0,
                min_face_size=20,
                thresholds=[0.6, 0.7, 0.7],
                factor=0.709,
                post_process=False,
                keep_all=True,
                device=self.device
            )
            self.embedder = InceptionResnetV1(pretrained='vggface2').eval().to(self.device)
            self.embedding_size = 512  # FaceNet also produces 512-dimensional embeddings
        elif not self.use_arcface:
            raise RuntimeError("❌ No face recognition backend available! Install insightface or facenet-pytorch.")
        
        print(f"[OK] Face Recognition Pipeline initialized (ArcFace: {self.use_arcface}, YOLO: {self.use_yolo})")

    def _detect_faces_yolo(self, frame: np.ndarray):
        """Detect faces using YOLOv8s-Face."""
        if not self.use_yolo:
            return None, None
        
        try:
            # Run YOLO inference
            results = self.yolo_model(frame, conf=0.5, verbose=False)
            
            boxes = []
            confidences = []
            
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        # Get bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        conf = box.conf[0].cpu().numpy()
                        
                        boxes.append([int(x1), int(y1), int(x2), int(y2)])
                        confidences.append(float(conf))
            
            return np.array(boxes) if boxes else None, confidences if confidences else None
        except Exception as e:
            print(f"[WARN] YOLO detection error: {e}")
            return None, None

    def _detect_faces_mtcnn(self, frame_rgb: np.ndarray):
        """Detect faces using MTCNN (fallback)."""
        if not MTCNN_AVAILABLE:
            return None, None
        
        try:
            boxes, probs = self.mtcnn.detect(frame_rgb)
            return boxes, probs.tolist() if probs is not None else None
        except Exception as e:
            print(f"[WARN] MTCNN detection error: {e}")
            return None, None

    def _extract_embedding_arcface(self, frame: np.ndarray, boxes: np.ndarray = None):
        """
        Extract face embeddings using ArcFace (InsightFace).
        InsightFace does its own detection, so boxes parameter is ignored.
        Returns: (embeddings, cropped_faces, detected_boxes)
        """
        if not self.use_arcface:
            return None, None, None
        
        try:
            # InsightFace processes the entire frame and returns face data (detection + embedding)
            faces = self.face_app.get(frame)
            
            if not faces:
                return None, None, None
            
            embeddings = []
            cropped_faces = []
            detected_boxes = []
            
            for face in faces:
                # Get embedding (already normalized by InsightFace, but we'll normalize again to be safe)
                embedding = face.embedding
                embedding_norm = embedding / np.linalg.norm(embedding)  # L2 normalize
                embeddings.append(embedding_norm)
                
                # Get bounding box from InsightFace detection
                bbox = face.bbox.astype(int)
                x1, y1, x2, y2 = max(0, bbox[0]), max(0, bbox[1]), min(frame.shape[1], bbox[2]), min(frame.shape[0], bbox[3])
                detected_boxes.append([x1, y1, x2, y2])
                
                # Crop face (convert RGB to BGR for OpenCV compatibility)
                cropped = frame[y1:y2, x1:x2]
                if cropped.size > 0:
                    cropped_faces.append(cropped)
                else:
                    # Fallback: use a placeholder
                    cropped_faces.append(frame[y1:y2, x1:x2] if y2 > y1 and x2 > x1 else frame[:100, :100])
            
            # Return boxes detected by InsightFace (not the input boxes)
            return embeddings, cropped_faces, detected_boxes
        except Exception as e:
            print(f"[WARN] ArcFace embedding error: {e}")
            import traceback
            traceback.print_exc()
            return None, None, None

    def _extract_embedding_facenet(self, frame_rgb: np.ndarray, boxes: np.ndarray):
        """Extract face embeddings using FaceNet (fallback)."""
        if not MTCNN_AVAILABLE:
            return None, None
        
        try:
            # Use MTCNN to align and extract face tensors
            face_tensors = self.mtcnn(frame_rgb)
            
            if face_tensors is None:
                return None, None
            
            face_tensors = face_tensors.to(self.device)
            
            with torch.no_grad():
                embeddings = self.embedder(face_tensors).cpu().numpy()
            
            # Convert tensors to images
            cropped_faces = []
            for i, tensor in enumerate(face_tensors):
                aligned_np_rgb = tensor.permute(1, 2, 0).cpu().numpy().astype(np.uint8)
                aligned_bgr = cv2.cvtColor(aligned_np_rgb, cv2.COLOR_RGB2BGR)
                cropped_faces.append(aligned_bgr)
            
            # Normalize embeddings
            embeddings_norm = []
            for emb in embeddings:
                emb_norm = emb / np.linalg.norm(emb)
                embeddings_norm.append(emb_norm)
            
            return embeddings_norm, cropped_faces
        except Exception as e:
            print(f"[WARN] FaceNet embedding error: {e}")
            return None, None

    def process_frame(self, frame: np.ndarray):
        """
        Detects faces in a video frame and generates ArcFace embeddings.
        
        Returns:
            List of dictionaries with 'box', 'embedding', 'cropped_image', 'box_area'
        """
        if frame is None or frame.size == 0:
            return []
        
        # Convert BGR to RGB for processing
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        faces_data = []
        
        # Step 1 & 2: Detect faces and extract embeddings
        if self.use_arcface:
            # ArcFace (InsightFace) does its own detection + embedding in one step
            embeddings, cropped_faces, detected_boxes = self._extract_embedding_arcface(frame_rgb)
            if embeddings is None or len(embeddings) == 0:
                return []
            # Use boxes from ArcFace detection
            boxes = detected_boxes
        else:
            # Use YOLO or MTCNN for detection, then FaceNet for embedding
            if self.use_yolo:
                boxes, confidences = self._detect_faces_yolo(frame_rgb)
            else:
                boxes, confidences = self._detect_faces_mtcnn(frame_rgb)
            
            if boxes is None or len(boxes) == 0:
                return []
            
            embeddings, cropped_faces = self._extract_embedding_facenet(frame_rgb, boxes)
            if embeddings is None or len(embeddings) == 0:
                return []
        
        # Step 3: Combine detection and embedding data
        for i, box in enumerate(boxes):
            if i >= len(embeddings):
                break
            
            x1, y1, x2, y2 = box[:4] if isinstance(box, (list, np.ndarray)) else (box[0], box[1], box[2], box[3])
            box_area = (x2 - x1) * (y2 - y1)
            
            # Get cropped face
            if i < len(cropped_faces):
                cropped = cropped_faces[i]
                if self.use_arcface:
                    # ArcFace crops are already in RGB, convert to BGR for OpenCV
                    if len(cropped.shape) == 3 and cropped.shape[2] == 3:
                        cropped_bgr = cv2.cvtColor(cropped, cv2.COLOR_RGB2BGR)
                    else:
                        cropped_bgr = cropped
                else:
                    cropped_bgr = cropped
            else:
                # Fallback: crop from original frame (BGR)
                cropped_bgr = frame[y1:y2, x1:x2]
            
            faces_data.append({
                'box': (int(x1), int(y1), int(x2), int(y2)),
                'embedding': embeddings[i],
                'cropped_image': cropped_bgr,
                'box_area': box_area
            })
        
        return faces_data

    def get_reference_embedding(self, ref_sources: list):
        """
        Calculates averaged embedding from multiple reference images.
        Uses the LARGEST face from each reference image to prevent background contamination.
        
        Returns:
            L2-normalized mean embedding vector, or None if no faces found
        """
        embeddings = []
        
        for source in ref_sources:
            img = None
            if isinstance(source, FileStorage):
                image_bytes = source.read()
                nparr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                source.seek(0)  # Reset file pointer for potential reuse
            elif isinstance(source, str):
                img = cv2.imread(source)
            
            if img is None or img.size == 0:
                continue
            
            # Process reference image to find all faces
            all_faces_in_image = self.process_frame(img)
            
            if not all_faces_in_image:
                source_name = source.filename if isinstance(source, FileStorage) else source
                print(f"[WARN] Warning: No faces found in reference image: {source_name}")
                continue
            
            # Use the LARGEST face from each reference image
            largest_face = max(all_faces_in_image, key=lambda face: face['box_area'])
            embeddings.append(largest_face['embedding'])
        
        if not embeddings:
            print("[ERROR] No usable faces found in any reference images.")
            return None
        
        # Average embeddings from largest faces
        mean_embedding = np.mean(embeddings, axis=0)
        
        # L2-normalize the final mean vector
        norm = np.linalg.norm(mean_embedding)
        if norm == 0:
            return None
        
        return mean_embedding / norm
