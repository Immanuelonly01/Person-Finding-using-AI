import os, cv2
from config import REFERENCE_DIR
from .face_embedding import ArcFaceEmbedder

def load_reference_embeddings():
    embedder = ArcFaceEmbedder()
    embeddings = {}
    for fn in os.listdir(REFERENCE_DIR):
        if fn.lower().endswith(('.jpg', '.jpeg', '.png')):
            path = os.path.join(REFERENCE_DIR, fn)
            img = cv2.imread(path)
            emb = embedder.get_embedding(img)
            if emb is not None:
                embeddings[fn] = emb
                print(f"[INFO] Loaded reference: {fn}")
            else:
                print(f"[WARN] No face found in {fn}")
    return embeddings
