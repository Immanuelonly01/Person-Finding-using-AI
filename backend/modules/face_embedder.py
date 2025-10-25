import torch
import torch.nn as nn
import torchvision.transforms as transforms
import cv2
import numpy as np
import os
from ..config import ARC_FACE_MODEL_PATH

class FaceEmbedder:
    """Generates 512D ArcFace embeddings using MobileFaceNet backbone."""
    def __init__(self, model_path=ARC_FACE_MODEL_PATH):
        
        # Define the transformations required by most face recognition models (e.g., 112x112, normalization)
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((112, 112)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
        ])
        
        # --- MODEL LOADING LOGIC (CRITICAL SECTION) ---
        try:
            if not os.path.exists(model_path):
                 raise FileNotFoundError(f"ArcFace weights not found at: {model_path}")
            
            # This is a placeholder structure. You need the MobileFaceNet class 
            # definition and then load its state_dict:
            
            # self.model = MobileFaceNet() 
            # self.model.load_state_dict(torch.load(model_path))
            
            # Using torch.jit.load for robustness assuming a TorchScript export
            self.model = torch.jit.load(model_path) 
            
        except (FileNotFoundError, Exception) as e:
            print(f"⚠️ ERROR LOADING ARC-FACE: {e}. Falling back to ResNet-18 (Low Accuracy).")
            
            # Fallback for demonstration/testing (LOW ACCURACY)
            self.model = torch.hub.load('pytorch/vision', 'resnet18', pretrained=True)
            self.model.fc = nn.Identity() # Convert to feature extractor
            
        self.model.eval()
        print(f"Model loaded: {self.model.__class__.__name__}")

    def get_embedding(self, face_image: np.ndarray):
        """Generates a feature vector for a single face image."""
        if face_image is None or face_image.size == 0:
            return None
            
        image_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
        tensor = self.transform(image_rgb).unsqueeze(0) # Add batch dimension

        with torch.no_grad():
            embedding = self.model(tensor).squeeze().numpy()
            
        # L2 Normalization (Crucial for reliable cosine similarity)
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
            
        # Average the embeddings
        return np.mean(embeddings, axis=0)