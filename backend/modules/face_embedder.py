# D:\Projects\Final Year Project\Deploy\backend\modules\face_embedder.py

import torch
import torchvision.transforms as transforms
import cv2
import numpy as np
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

    def get_reference_embedding(self, ref_paths: list):
        """Calculates a single averaged embedding from multiple reference images."""
        embeddings = []
        for path in ref_paths:
            img = cv2.imread(path)
            if img is not None:
                embedding = self.get_embedding(img) 
                if embedding is not None:
                    embeddings.append(embedding)
        
        if not embeddings:
            return None
            
        return np.mean(embeddings, axis=0)