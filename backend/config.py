import os
import sys

# --- HELPER FUNCTION FOR SAFE PRINTING (Windows console compatibility) ---
def safe_print(message):
    """Print message safely, handling Windows console encoding issues."""
    try:
        print(message)
    except UnicodeEncodeError:
        # Remove emojis and special characters if encoding fails
        safe_message = message.encode('ascii', 'ignore').decode('ascii')
        print(safe_message)

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
    safe_print("[INFO] Initializing filesystem...")
    # Create static/internal folders
    for folder in [UPLOAD_FOLDER, MATCHES_FOLDER, REPORTS_FOLDER, MODELS_FOLDER, DATABASE_DIR]:
        os.makedirs(folder, exist_ok=True)
    safe_print("[INFO] Filesystem checks complete.")

# EXECUTE FOLDER CREATION IMMEDIATELY WHEN MODULE IS IMPORTED
# This runs once when the Flask app starts.
initialize_filesystem()

# --- DEEP LEARNING CONFIGURATION ---

# High-accuracy threshold for ArcFace embeddings (0.75+ as specified)
# ArcFace provides superior accuracy compared to FaceNet, allowing for stricter thresholds
SIMILARITY_THRESHOLD = 0.75

# (UPDATED) Skip 10 frames to balance processing speed and detection recall.
# 5 was processing too many frames for this heavy pipeline.
FRAME_SKIP = 10 

# --- ADD THIS LINE ---
# Cooldown period (in frames) to prevent logging the same person 
# 100 times in a row. (e.g., 30 frames @ 30fps = 1 second)
MATCH_COOLDOWN_FRAMES = 30