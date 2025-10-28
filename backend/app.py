# D:\Projects\Final Year Project\Deploy\backend\app.py

from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS 
from werkzeug.utils import secure_filename
import os
import sqlite3
import shutil 
import json 
import cv2 # OpenCV for webcam/video processing
import uuid 
import time 

# --- Corrected Absolute Imports ---
from backend.config import (
    UPLOAD_FOLDER, REPORTS_FOLDER, MATCHES_FOLDER, DB_PATH, initialize_filesystem
)
from backend.modules.video_processor import VideoProcessor
from backend.modules.report_generator import ReportGenerator
from backend.database.init_db import init_db
# ----------------------------------

# --- GLOBAL EMBEDDING STORAGE (CRITICAL for two-step stream) ---
LIVE_EMBEDDING_CACHE = {} 

# Call the file system initializer
initialize_filesystem()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app) 

# Initialize DB on startup
init_db()

# --- Cleanup Function ---
def clear_previous_session_data():
    """Deletes all entries from DB and clears static file directories."""
    print("🧹 Starting session cleanup...")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM detections")
        conn.commit()
        conn.close()
        print("    -> Database entries cleared.")
    except Exception as e:
        print(f"    -> ERROR clearing DB: {e}")

    for folder_path in [UPLOAD_FOLDER, MATCHES_FOLDER, REPORTS_FOLDER]:
        try:
            if os.path.exists(folder_path):
                shutil.rmtree(folder_path)
            os.makedirs(folder_path, exist_ok=True)
            print(f"    -> Cleared folder: {os.path.basename(folder_path)}")
        except Exception as e:
            print(f"    -> ERROR clearing folder {os.path.basename(folder_path)}: {e}")
    print("🧹 Cleanup complete.")


# --- LIVE FEED: MJPEG Generator (Step 2 Logic) ---
def generate_mjpeg_stream(processor, reference_embedding):
    """Draws bounding boxes and streams processed frames as MJPEG."""
    
    # Use 0 for the default webcam
    cap = cv2.VideoCapture(0) 
    
    if not cap.isOpened():
        print("🔴 ERROR: Could not open webcam.")
        return 

    print("▶️ Starting MJPEG webcam stream with detection...")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        
        frame_copy = frame.copy()
        
        detected_faces = processor.detector.detect_faces(frame_copy)
        
        for face_data in detected_faces:
            target_embedding = processor.embedder.get_embedding(face_data['image'])
            similarity, is_match = processor.matcher.match(target_embedding, reference_embedding)

            # Determine box color and text based on match status
            (x1, y1, x2, y2) = face_data['box']
            
            if is_match:
                color = (0, 255, 0) # Green BGR for Match
                text = f"MATCH: {similarity:.2f}"
            else:
                color = (255, 0, 0) # Blue BGR for No Match
                text = f"SIM: {similarity:.2f}"

            # Draw the box and text on the frame
            cv2.rectangle(frame_copy, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame_copy, text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        # Encode the frame into JPEG format
        ret, buffer = cv2.imencode('.jpg', frame_copy)
        if not ret: continue

        # Yield the JPEG frame as part of the multipart stream
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    # CLEANUP: Remove embedding from cache when stream ends
    # Note: The stream thread usually dies if the client closes the connection.
    # The cache removal logic is often simplified here, but in a production system, 
    # it would be wrapped around the generator call or handled by a timer.
    cap.release()
    print("⏸️ MJPEG stream stopped.")


# --- LIVE FEED: Step 1 (POST) - Upload Reference and Calculate Embedding ---
@app.route('/api/live/upload_ref', methods=['POST']) 
def upload_live_reference():
    """Calculates embedding, stores it in cache, and returns a session ID."""
    
    if 'reference_images' not in request.files:
        return jsonify({"message": "Missing reference images."}), 400
        
    ref_files = request.files.getlist('reference_images')
    
    # Calculate embedding (pass FileStorage list directly)
    processor = VideoProcessor() 
    reference_embedding = processor.embedder.get_reference_embedding(ref_files)

    if reference_embedding is None:
        return jsonify({"message": "Could not generate reference embedding."}), 500

    # Store embedding and generate session ID
    session_id = str(uuid.uuid4())
    LIVE_EMBEDDING_CACHE[session_id] = reference_embedding
    
    print(f"🟢 LIVE Session Ready: {session_id}. Cache Size: {len(LIVE_EMBEDDING_CACHE)}")
    
    return jsonify({"message": "Reference uploaded successfully.", "session_id": session_id}), 200


# --- LIVE FEED: Step 2 (GET) - Start Streaming ---
@app.route('/api/live/stream/<session_id>') 
def stream_live_feed(session_id):
    """Starts MJPEG stream by retrieving embedding from cache."""
    if session_id not in LIVE_EMBEDDING_CACHE:
        return jsonify({"message": "Session not found or expired."}), 404
        
    embedding = LIVE_EMBEDDING_CACHE.get(session_id)
    
    # Initialize processor inside the stream route handler
    processor = VideoProcessor() 

    # START MJPEG STREAM: Pass the initialized objects
    return Response(
        generate_mjpeg_stream(processor, embedding), 
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )


# --- BATCH PROCESSING ROUTES ---
@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Handles batch video upload and processing."""
    
    clear_previous_session_data()
    
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
    # Note: process_video needs to be updated to process_video_generator 
    # to align with sequential output logic, but here we call the older sync version for file saving.
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