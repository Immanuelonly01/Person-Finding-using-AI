# D:\Projects\Final Year Project\Deploy\backend\app.py (FINAL VERSION)

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import sqlite3
import shutil # Import for file deletion

# --- Corrected Absolute Imports ---
from backend.config import (
    UPLOAD_FOLDER, REPORTS_FOLDER, MATCHES_FOLDER, DB_PATH, initialize_filesystem
)
from backend.modules.video_processor import VideoProcessor
from backend.modules.report_generator import ReportGenerator
from backend.database.init_db import init_db
# ----------------------------------

# Call the file system initializer
initialize_filesystem()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app) 

# Initialize DB on startup
init_db()

# --- NEW: Cleanup Function ---
def clear_previous_session_data():
    """Deletes all entries from DB and clears static file directories."""
    print("🧹 Starting session cleanup...")
    
    # 1. Clear Database Table
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM detections")
        conn.commit()
        conn.close()
        print("    -> Database entries cleared.")
    except Exception as e:
        print(f"    -> ERROR clearing DB: {e}")

    # 2. Clear Static Directories
    for folder_path in [UPLOAD_FOLDER, MATCHES_FOLDER, REPORTS_FOLDER]:
        try:
            # Delete and recreate the folder to ensure it's empty
            if os.path.exists(folder_path):
                shutil.rmtree(folder_path)
            os.makedirs(folder_path, exist_ok=True)
            print(f"    -> Cleared folder: {os.path.basename(folder_path)}")
        except Exception as e:
            print(f"    -> ERROR clearing folder {os.path.basename(folder_path)}: {e}")
    print("🧹 Cleanup complete.")


@app.route('/api/upload', methods=['POST'])
def upload_files():
    
    # --- CRITICAL FIX: CLEANUP BEFORE PROCESSING ---
    clear_previous_session_data()
    
    # 1. Validation
    if 'video' not in request.files or 'reference_images' not in request.files:
        return jsonify({"message": "Missing video or reference images."}), 400
        
    video_file = request.files['video']
    ref_files = request.files.getlist('reference_images')
    
    # 2. Save Files
    video_filename = secure_filename(video_file.filename)
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_filename)
    video_file.save(video_path)
    
    ref_paths = []
    for i, ref_file in enumerate(ref_files):
        ref_filename = secure_filename(f"ref_{i}_{ref_file.filename}")
        ref_path = os.path.join(app.config['UPLOAD_FOLDER'], ref_filename)
        ref_file.save(ref_path)
        ref_paths.append(ref_path)

    # 3. Start Deep Learning Processing
    processor = VideoProcessor()
    result = processor.process_video(video_path, ref_paths)
    
    # 4. Generate Reports on completion
    if result['status'] == 'completed':
        generator = ReportGenerator()
        csv_report_path = generator.generate_csv(video_filename)
        pdf_report_path = generator.generate_pdf(video_filename)
        
        return jsonify({
            "message": "Processing complete.", 
            "video_name": video_filename, 
            "report_urls": {
                "csv": os.path.basename(csv_report_path) if csv_report_path else None,
                "pdf": os.path.basename(pdf_report_path) if pdf_report_path else None
            },
            "details": result
        }), 200
    else:
        return jsonify({"message": "Processing failed.", "details": result}), 500

@app.route('/api/results/<video_name>', methods=['GET'])
def get_results(video_name):
    """Fetches detection logs for a video from the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT frame_number, timestamp, similarity, match_image_path FROM detections WHERE video_filename = ? ORDER BY frame_number",
        (video_name,)
    )
    results = [
        {
            "frame": row[0],
            "timestamp": row[1],
            "similarity": f"{row[2]:.4f}",
            "image_url": f"/api/static/matches/{row[3]}"
        } for row in cursor.fetchall()
    ]
    conn.close()
    return jsonify(results)

@app.route('/api/static/<folder>/<filename>')
def serve_static(folder, filename):
    """Serves matched images and reports."""
    if folder == 'matches':
        return send_from_directory(MATCHES_FOLDER, filename)
    elif folder == 'reports':
        return send_from_directory(REPORTS_FOLDER, filename, as_attachment=True)
    return jsonify({"message": "Not Found"}), 404

if __name__ == '__main__':
    print("🚀 Starting Flask API on http://0.0.0.0:5000 (via app.py __main__)")
    app.run(debug=True, host='0.0.0.0', port=5000)