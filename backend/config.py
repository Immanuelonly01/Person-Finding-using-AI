import os

# --- PATH CONFIGURATION ---

# Base directory for the 'backend' folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) 

# Static Content Directories (served by Flask)
STATIC_DIR = os.path.join(BASE_DIR, 'static')
UPLOAD_FOLDER = os.path.join(STATIC_DIR, 'uploads')
MATCHES_FOLDER = os.path.join(STATIC_DIR, 'matches')
REPORTS_FOLDER = os.path.join(STATIC_DIR, 'reports')

# Internal Directories (not served)
MODELS_FOLDER = os.path.join(BASE_DIR, 'models')
DATABASE_DIR = os.path.join(BASE_DIR, 'database')
DB_PATH = os.path.join(DATABASE_DIR, 'project.db')

# --- INITIALIZATION FUNCTION ---
def initialize_filesystem():
    """Ensures all necessary static and internal directories exist."""
    print("🛠️ Initializing filesystem...")
    # Create static/internal folders
    for folder in [UPLOAD_FOLDER, MATCHES_FOLDER, REPORTS_FOLDER, MODELS_FOLDER, DATABASE_DIR]:
        os.makedirs(folder, exist_ok=True)
    print("🛠️ Filesystem checks complete.")

# EXECUTE FOLDER CREATION IMMEDIATELY WHEN MODULE IS IMPORTED
# This runs once when the Flask app starts.
initialize_filesystem()

# --- DEEP LEARNING CONFIGURATION ---

# (UPDATED) 0.70 is a balanced, high-security threshold for aligned FaceNet.
# 0.75 was likely too strict and would miss many potential matches.
SIMILARITY_THRESHOLD = 0.70

# (UPDATED) Skip 10 frames to balance processing speed and detection recall.
# 5 was processing too many frames for this heavy pipeline.
FRAME_SKIP = 10