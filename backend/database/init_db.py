import sqlite3
import os

# Must use a relative import trick or ensure config is on path for standalone run
try:
    from ..config import DB_PATH
except ImportError:
    # Fallback for running the script directly
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DB_PATH = os.path.join(BASE_DIR, 'database', 'project.db')

def init_db():
    # Ensure the database directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_filename TEXT NOT NULL,
            frame_number INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            similarity REAL NOT NULL,
            match_image_path TEXT NOT NULL,
            processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    conn.commit()
    conn.close()
    print(f"✅ Database initialized at: {DB_PATH}")

if __name__ == '__main__':
    init_db()