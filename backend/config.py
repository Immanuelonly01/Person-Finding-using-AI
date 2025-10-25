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

# Database
DB_PATH = os.path.join(BASE_DIR, 'database', 'project.db')

# --- INITIALIZATION FUNCTION ---
def initialize_filesystem():
    """Ensures all necessary static and model directories exist."""
    print("🛠️ Initializing static directories...")
    for folder in [UPLOAD_FOLDER, MATCHES_FOLDER, REPORTS_FOLDER, MODELS_FOLDER]:
        os.makedirs(folder, exist_ok=True)
    print("🛠️ Filesystem checks complete.")

# EXECUTE FOLDER CREATION IMMEDIATELY WHEN MODULE IS IMPORTED
initialize_filesystem()

# --- DEEP LEARNING CONFIGURATION ---
SIMILARITY_THRESHOLD = 0.75 
FRAME_SKIP = 5