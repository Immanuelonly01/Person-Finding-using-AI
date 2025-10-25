import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

REFERENCE_DIR = os.path.join(BASE_DIR, "reference_images")
THRESHOLD = 0.45   # cosine similarity threshold
DEVICE = 'cpu'     # change to 'cuda' if you have GPU
