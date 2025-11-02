import cv2
import numpy as np
import torch
# --- REMOVED ---
# from torchvision import transforms  (No longer needed)
# ---------------
from facenet_pytorch import MTCNN, InceptionResnetV1
from werkzeug.datastructures import FileStorage

class FaceRecognitionPipeline:
    """
    Handles Face Detection (MTCNN), Face Alignment, and Embedding Generation (FaceNet)
    in a single, optimized class.
    """

    def __init__(self):
        # 1. Device Setup (Uses your GTX 1650)
        self.device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
        print(f"Loading Models on device: {self.device}...")

        # 2. MTCNN Detector & Aligner Setup
        self.mtcnn = MTCNN(
            image_size=160, 
            margin=0, 
            min_face_size=20, # Minimum face size to detect
            thresholds=[0.6, 0.7, 0.7], 
            factor=0.709, 
            post_process=False, # Keeps tensors in [0, 255] range
            keep_all=True, # Detect all faces
            device=self.device
        )
        
        # 3. FaceNet Embedder Setup
        self.embedder = InceptionResnetV1(pretrained='vggface2').eval().to(self.device)
            
        # 4. --- REMOVED TRANSFORM ---
        # The InceptionResnetV1 model handles its own normalization
        # when fed [0, 255] tensors from MTCNN (with post_process=False).
        # self.transform = ... (Removed)
        # ---------------------------

        print("✅ Face Recognition Pipeline (MTCNN + FaceNet) loaded successfully.")

    def process_frame(self, frame: np.ndarray):
        """
        Detects faces in a video frame, aligns them, and generates embeddings.
        """
        if frame is None or frame.size == 0:
            return []
            
        # Convert BGR (OpenCV) to RGB (PyTorch/PIL)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # --- UPDATED DETECTION/ALIGNMENT LOGIC ---
        # 1. Detect faces and get bounding boxes
        boxes, _ = self.mtcnn.detect(frame_rgb)
        
        # 2. Get aligned face tensors ([0, 255] range)
        face_tensors = self.mtcnn(frame_rgb)
        # ----------------------------------------
        
        faces_data = []
        
        if face_tensors is not None and boxes is not None:
            # Move tensors to the correct device
            face_tensors = face_tensors.to(self.device)
            
            with torch.no_grad():
                # Generate embeddings. The embedder handles normalization.
                embeddings = self.embedder(face_tensors).cpu().numpy()
            
            # Ensure we have the same number of boxes and embeddings
            if len(boxes) != len(embeddings):
                return [] 
            
            for i, box in enumerate(boxes):
                # --- UPDATED IMAGE CONVERSION ---
                # Tensors are [0, 255], so we just convert type, not denormalize from [-1, 1]
                aligned_np_rgb = face_tensors[i].permute(1, 2, 0).cpu().numpy().astype(np.uint8)
                aligned_bgr = cv2.cvtColor(aligned_np_rgb, cv2.COLOR_RGB2BGR)
                # --------------------------------

                # L2 Normalize the embedding (standard practice)
                embedding = embeddings[i]
                embedding_norm = embedding / np.linalg.norm(embedding) 
                
                # --- ADDED 'box_area' TO THE DICTIONARY ---
                x1, y1, x2, y2 = box.astype(int)
                box_area = (x2 - x1) * (y2 - y1)
                
                faces_data.append({
                    'box': (x1, y1, x2, y2), 
                    'embedding': embedding_norm,
                    'cropped_image': aligned_bgr,
                    'box_area': box_area # We will use this to find the largest face
                })
                    
        return faces_data

    def get_reference_embedding(self, ref_sources: list):
        """
        Calculates a single averaged embedding from multiple reference sources (images).
        
        --- CRITICAL UPDATE ---
        This function now finds ALL faces in the reference images and ONLY
        uses the embedding from the LARGEST face in each image.
        This prevents background faces from "poisoning" the reference.
        """
        embeddings = []
        
        for source in ref_sources:
            img = None
            if isinstance(source, FileStorage):
                image_bytes = source.read()
                nparr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            elif isinstance(source, str):
                img = cv2.imread(source)
            
            if img is not None and img.size > 0:
                # Process the reference image to find all faces
                all_faces_in_image = self.process_frame(img)
                
                if not all_faces_in_image:
                    print(f"Warning: No faces found in reference image: {source.filename if isinstance(source, FileStorage) else source}")
                    continue # Skip this image if no faces are found

                # --- START OF FIX ---
                # Find the face with the largest bounding box area
                largest_face = max(all_faces_in_image, key=lambda face: face['box_area'])
                
                # Add the embedding of ONLY the largest face
                embeddings.append(largest_face['embedding'])
                # --- END OF FIX ---
        
        if not embeddings:
            print("❌ ERROR: No usable faces found in any reference images.")
            return None
            
        # Average the embeddings from the largest faces
        mean_embedding = np.mean(embeddings, axis=0)
        
        # --- CRITICAL UPDATE: L2-Normalize the final mean vector ---
        norm = np.linalg.norm(mean_embedding)
        if norm == 0:
            return None
            
        return mean_embedding / norm
        # -----------------------------------------------------------