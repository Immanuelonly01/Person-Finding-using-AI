from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os

# Import modules and configuration
from config import UPLOAD_FOLDER, REPORTS_FOLDER, MATCHES_FOLDER
from modules.video_processor import VideoProcessor
from modules.report_generator import ReportGenerator
from database.init_db import init_db
from config import DB_PATH # Imported to query results

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app) # Enables cross-origin requests for the React frontend

# Initialize DB on startup
init_db()

@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Handles file upload, starts video processing, and generates reports."""
    
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
    # NOTE: For production, this should run asynchronously (e.g., using Celery).
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
                # Return only filenames; the frontend uses the static endpoint to fetch them
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
    import sqlite3 # Import here to avoid circular dependency issues if any
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
        # Serves images for the dashboard
        return send_from_directory(MATCHES_FOLDER, filename)
    elif folder == 'reports':
        # Forces download for reports
        return send_from_directory(REPORTS_FOLDER, filename, as_attachment=True)
    return jsonify({"message": "Not Found"}), 404

if __name__ == '__main__':
    print("🚀 Starting Flask API on http://0.0.0.0:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)