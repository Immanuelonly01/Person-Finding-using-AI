# In backend/modules/face_embedder.py

import torch
import torchvision.transforms as transforms
import cv2
import numpy as np
import os
from facenet_pytorch import InceptionResnetV1 # New import

class FaceEmbedder:
    def __init__(self):
        print("Loading InceptionResnetV1 (FaceNet) from facenet-pytorch...")
        try:
            # Loads InceptionResnetV1 pretrained on VGGFace2 dataset (high accuracy)
            self.model = InceptionResnetV1(pretrained='vggface2').eval()
            self.model.eval()
        except Exception as e:
            print(f"ERROR: Could not load facenet-pytorch model: {e}")
            raise
            
        # Standard input size and normalization for this model (160x160)
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((160, 160)), # Standard input size for this model
            transforms.ToTensor(),
            # Normalization specific to InceptionResnetV1
            transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]), 
        ])
    
    # Rest of the get_embedding and get_reference_embedding methods remain the same
    # (Except change the image size usage inside transform, which is already 160x160 above)
    
    def get_embedding(self, face_image: np.ndarray):
        if face_image is None or face_image.size == 0:
            return None
        
        image_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
        tensor = self.transform(image_rgb).unsqueeze(0)

        with torch.no_grad():
            embedding = self.model(tensor).squeeze().numpy()
            
        # L2 Normalization (Crucial for reliable cosine similarity)
        embedding = embedding / np.linalg.norm(embedding)
        return embedding

    def get_reference_embedding(self, ref_paths: list):
        # ... (Same as original implementation)
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