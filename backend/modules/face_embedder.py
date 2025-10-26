# D:\Projects\Final Year Project\Deploy\backend\modules\face_embedder.py
import cv2
import numpy as np
from werkzeug.datastructures import FileStorage
import torch
import torchvision.transforms as transforms
from facenet_pytorch import InceptionResnetV1 # New import for automatic loading

class FaceEmbedder:
    """Generates face embeddings using the InceptionResnetV1 (FaceNet) model."""

    def __init__(self):
        try:
            # Loads InceptionResnetV1 pretrained on VGGFace2 dataset (high accuracy)
            self.model = InceptionResnetV1(pretrained='vggface2').eval()
            self.model.eval()
            print("✅ InceptionResnetV1 (FaceNet) model loaded/downloaded automatically.")
        except Exception as e:
            print(f"ERROR: Could not load facenet-pytorch model: {e}")
            raise
            
        # Standard transformations for this model (160x160 input)
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((160, 160)), 
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]), 
        ])

    def get_embedding(self, face_image: np.ndarray):
        """Generates a feature vector for a single face image."""
        if face_image is None or face_image.size == 0:
            return None
            
        image_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
        tensor = self.transform(image_rgb).unsqueeze(0)

        with torch.no_grad():
            embedding = self.model(tensor).squeeze().numpy()
            
        embedding = embedding / np.linalg.norm(embedding)
        return embedding

    def get_reference_embedding(self, ref_sources: list):
        """
        Calculates a single averaged embedding from multiple reference sources.
        ref_sources can be a list of FileStorage objects (from API) or saved file paths.
        """
        embeddings = []
        
        for source in ref_sources:
            img = None
            
            # --- Handling FileStorage Object (API Upload FIX) ---
            if isinstance(source, FileStorage):
                # Read file stream bytes into a NumPy array suitable for OpenCV
                image_bytes = source.read()
                nparr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # --- Handling File Path (If saved path is used) ---
            elif isinstance(source, str):
                img = cv2.imread(source)
            
            if img is not None and img.size > 0:
                # Detect the face and get embedding
                embedding = self.get_embedding(img)
                if embedding is not None:
                    embeddings.append(embedding)
        
        if not embeddings:
            return None
            
        # Average the embeddings for a single, robust reference vector
        return np.mean(embeddings, axis=0)