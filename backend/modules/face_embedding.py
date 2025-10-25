import insightface
import numpy as np
import cv2

class ArcFaceEmbedder:
    def __init__(self, device='cpu'):
        self.model = insightface.app.FaceAnalysis(name='buffalo_l')
        self.model.prepare(ctx_id=0 if device != 'cpu' else -1)

    def get_embedding(self, image_bgr):
        faces = self.model.get(image_bgr)
        if not faces:
            return None
        return faces[0].embedding
