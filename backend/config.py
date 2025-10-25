import os

# --- PATH CONFIGURATION ---

# Base Directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Static Content Directories
STATIC_DIR = os.path.join(BASE_DIR, 'static')
UPLOAD_FOLDER = os.path.join(STATIC_DIR, 'uploads')
MATCHES_FOLDER = os.path.join(STATIC_DIR, 'matches')
REPORTS_FOLDER = os.path.join(STATIC_DIR, 'reports')
MODELS_FOLDER = os.path.join(BASE_DIR, 'models')

# Ensure directories exist
for folder in [UPLOAD_FOLDER, MATCHES_FOLDER, REPORTS_FOLDER, MODELS_FOLDER]:
    os.makedirs(folder, exist_ok=True)

# Database
DB_PATH = os.path.join(BASE_DIR, 'database', 'project.db')

# Model Paths
ARC_FACE_MODEL_FILENAME = 'mobilefacenet_arcface.pth'
ARC_FACE_MODEL_PATH = os.path.join(MODELS_FOLDER, ARC_FACE_MODEL_FILENAME)
# YOLO model path is dynamically handled by 'ultralytics'

# --- DEEP LEARNING CONFIGURATION ---

# COSINE SIMILARITY: 1.0 is identical. Use a value > 0.65 for high-confidence face matches.
SIMILARITY_THRESHOLD = 0.75 

# Video Processing Speed
FRAME_SKIP = 5 # Process every 5th frame