from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context
from flask_cors import CORS 
from werkzeug.utils import secure_filename
import os
import sqlite3
import shutil 
import json 
import cv2 # OpenCV for webcam/video processing
import uuid 
import time 
from datetime import timedelta 

# --- CRITICAL FIX: Use Absolute Imports from the 'backend' root ---
from backend.config import (
    UPLOAD_FOLDER, REPORTS_FOLDER, MATCHES_FOLDER, DB_PATH, initialize_filesystem
)
from backend.modules.video_processor import VideoProcessor
from backend.modules.report_generator import ReportGenerator
from backend.modules.notifications import send_match_alert
from backend.database.init_db import init_db
# ----------------------------------

# --- GLOBAL EMBEDDING STORAGE ---
LIVE_EMBEDDING_CACHE = {}
# --- LIVE FEED SESSION DATA (for report generation) ---
LIVE_SESSION_DATA = {}  # {session_id: {'matches': [], 'start_time': datetime, 'video_name': 'live_feed'}} 

# File system is initialized by config.py when it's first imported
# initialize_filesystem() # No need to call again

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Allow access from the React development server
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}) 

# Initialize DB on startup
init_db()

# --- Cleanup Function (No changes) ---
def clear_previous_session_data():
    """Deletes all entries from DB and and clears static file directories."""
    print("[INFO] Starting session cleanup...")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM detections")
        conn.commit()
        conn.close()
        print("     -> Database entries cleared.")
    except Exception as e:
        print(f"     -> ERROR clearing DB: {e}")

    for folder_path in [UPLOAD_FOLDER, MATCHES_FOLDER, REPORTS_FOLDER]:
        try:
            if os.path.exists(folder_path):
                shutil.rmtree(folder_path)
            os.makedirs(folder_path, exist_ok=True)
            print(f"     -> Cleared folder: {os.path.basename(folder_path)}")
        except Exception as e:
            print(f"     -> ERROR clearing folder {os.path.basename(folder_path)}: {e}")
    print("[INFO] Cleanup complete.")


# --- LIVE FEED: MJPEG Generator (UPDATED) ---
def generate_mjpeg_stream(processor, reference_embedding, session_id):
    """Draws bounding boxes and streams processed frames as MJPEG. Tracks matches for reports."""
    from datetime import datetime
    
    cap = cv2.VideoCapture(0) 
    
    if not cap.isOpened():
        print("[ERROR] Could not open webcam.")
        return 

    print("[INFO] Starting MJPEG webcam stream with detection...")
    
    # Initialize session data
    if session_id not in LIVE_SESSION_DATA:
        LIVE_SESSION_DATA[session_id] = {
            'matches': [],
            'start_time': datetime.now(),
            'video_name': f'live_feed_{session_id[:8]}',
            'frame_count': 0,
            'last_match_frame': -1000
        }
    
    session_data = LIVE_SESSION_DATA[session_id]
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        
        frame_count += 1
        session_data['frame_count'] = frame_count
        frame_copy = frame.copy()
        
        all_face_data_in_frame = processor.pipeline.process_frame(frame_copy)
        
        for face_data in all_face_data_in_frame:
            target_embedding = face_data['embedding']
            
            # Matcher handles both single embedding and list
            similarity, is_match = processor.matcher.match(target_embedding, reference_embedding)

            (x1, y1, x2, y2) = face_data['box']
            
            if is_match:
                color = (0, 255, 0) # Green BGR for Match
                text = f"MATCH: {similarity:.2f}"
                
                # Log match (with cooldown to prevent spam)
                if frame_count > session_data['last_match_frame'] + 30:  # 30 frame cooldown
                    timestamp = datetime.now().strftime('%H:%M:%S')
                    match_entry = {
                        'frame': frame_count,
                        'timestamp': timestamp,
                        'similarity': float(similarity),
                        'datetime': datetime.now().isoformat()
                    }
                    session_data['matches'].append(match_entry)
                    session_data['last_match_frame'] = frame_count
                    
                    # Save match image
                    try:
                        unique_id = uuid.uuid4().hex[:8]
                        match_filename = f"live_{session_id[:8]}_F{frame_count}_{unique_id}.jpg"
                        match_path = os.path.join(MATCHES_FOLDER, match_filename)
                        cv2.imwrite(match_path, face_data['cropped_image'])
                        
                        # Log to database
                        video_name = session_data['video_name']
                        processor._log_detection(video_name, frame_count, timestamp, float(similarity), match_filename)
                        
                        # Send notification
                        try:
                            from backend.modules.notifications import send_match_alert
                            send_match_alert(
                                video_name=video_name,
                                frame_number=frame_count,
                                timestamp=timestamp,
                                similarity=float(similarity),
                                person_name=None
                            )
                        except Exception as e:
                            print(f"[WARN] Notification error: {e}")
                    except Exception as e:
                        print(f"[WARN] Failed to save match image: {e}")
            else:
                color = (0, 0, 255) # Red BGR for No Match
                text = f"SIM: {similarity:.2f}"

            cv2.rectangle(frame_copy, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame_copy, text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        ret, buffer = cv2.imencode('.jpg', frame_copy)
        if not ret: continue

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    cap.release()
    print("[INFO] MJPEG stream stopped.")


# --- LIVE FEED: Step 1 (POST) - Upload Reference (UPDATED) ---
@app.route('/api/live/upload_ref', methods=['POST']) 
def upload_live_reference():
    """Calculates embedding list, stores it in cache, and returns a session ID."""
    
    if 'reference_images' not in request.files:
        return jsonify({"message": "Missing reference images."}), 400
        
    ref_files = request.files.getlist('reference_images')
    
    processor = VideoProcessor() 
    
    # get_reference_embedding returns a single averaged embedding (or None)
    reference_embedding = processor.pipeline.get_reference_embedding(ref_files)

    if reference_embedding is None:
        return jsonify({"message": "Could not generate reference embedding."}), 500

    session_id = str(uuid.uuid4())
    # Store as single embedding (matcher handles both single and list)
    LIVE_EMBEDDING_CACHE[session_id] = reference_embedding
    
    print(f"[OK] LIVE Session Ready: {session_id}. Cache Size: {len(LIVE_EMBEDDING_CACHE)}")
    
    return jsonify({"message": "Reference uploaded successfully.", "session_id": session_id}), 200


# --- LIVE FEED: Step 2 (GET) - Start Streaming (UPDATED) ---
@app.route('/api/live/stream/<session_id>') 
def stream_live_feed(session_id):
    """Starts MJPEG stream by retrieving embedding list from cache."""
    if session_id not in LIVE_EMBEDDING_CACHE:
        return jsonify({"message": "Session not found or expired."}), 404
        
    # Retrieve reference embedding from cache (single embedding, matcher handles it)
    reference_embedding = LIVE_EMBEDDING_CACHE.get(session_id)
    
    processor = VideoProcessor() 

    return Response(
        generate_mjpeg_stream(processor, reference_embedding, session_id), 
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )


# --- BATCH PROCESSING WITH SSE STREAMING ---
@app.route('/api/process-video', methods=['POST'])
def process_video_stream():
    """
    Handles video upload and processing with Server-Sent Events (SSE) for real-time progress.
    Returns streaming JSON updates via SSE.
    """
    clear_previous_session_data()
    
    if 'video' not in request.files or 'reference_images' not in request.files:
        return jsonify({"message": "Missing video or reference images."}), 400
        
    video_file = request.files['video']
    ref_files = request.files.getlist('reference_images')
    
    # Save Files
    video_filename = secure_filename(video_file.filename)
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_filename)
    video_file.save(video_path)
    
    ref_paths = []
    for i, ref_file in enumerate(ref_files):
        ref_filename = secure_filename(f"ref_{i}_{ref_file.filename}")
        ref_path = os.path.join(app.config['UPLOAD_FOLDER'], ref_filename)
        ref_file.save(ref_path)
        ref_paths.append(ref_path)

    def generate():
        """Generator function for SSE streaming."""
        processor = VideoProcessor()
        matches_found = []
        
        try:
            # Process video and stream updates
            for update in processor.process_video_generator(video_path, ref_paths):
                # Send progress update
                if update['status'] == 'start':
                    yield f"data: {json.dumps({'type': 'start', 'total_frames': update.get('total_frames', 0), 'filename': update.get('filename', video_filename)})}\n\n"
                
                elif update['status'] == 'progress':
                    yield f"data: {json.dumps({'type': 'progress', 'frame': update.get('frame_number', 0), 'match': False})}\n\n"
                
                elif update['status'] == 'match':
                    # Match detected - send alert and update
                    frame_num = update.get('frame_number', 0)
                    timestamp = update.get('timestamp', '00:00:00')
                    similarity = update.get('similarity', 0.0)
                    
                    matches_found.append({
                        'frame': frame_num,
                        'timestamp': timestamp,
                        'similarity': similarity
                    })
                    
                    # Send match notification (Email + Telegram)
                    try:
                        send_match_alert(
                            video_name=video_filename,
                            frame_number=frame_num,
                            timestamp=timestamp,
                            similarity=similarity,
                            person_name=None  # Can be customized based on reference images
                        )
                    except Exception as e:
                        print(f"[WARN] Notification error: {e}")
                    
                    yield f"data: {json.dumps({'type': 'match', 'frame': frame_num, 'total': update.get('total_frames', 0), 'match': True, 'person': 'Target Person', 'similarity': similarity, 'timestamp': timestamp})}\n\n"
                
                elif update['status'] == 'completed':
                    # Generate reports
                    generator = ReportGenerator()
                    csv_report_path = generator.generate_csv(video_filename)
                    pdf_report_path = generator.generate_pdf(video_filename)
                    
                    final_update = {
                        'type': 'completed',
                        'frames_processed': update.get('frames_processed', 0),
                        'matches_found': update.get('matches_found', 0),
                        'report_files': {
                            'csv': os.path.basename(csv_report_path) if csv_report_path else None,
                            'pdf': os.path.basename(pdf_report_path) if pdf_report_path else None
                        },
                        'progress': matches_found
                    }
                    yield f"data: {json.dumps(final_update)}\n\n"
                
                elif update['status'] == 'error':
                    yield f"data: {json.dumps({'type': 'error', 'message': update.get('message', 'Unknown error')})}\n\n"
                    break
                    
        except Exception as e:
            print(f"[ERROR] Processing error: {e}")
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'  # Disable buffering in nginx
        }
    )


# --- LEGACY BATCH PROCESSING (for backward compatibility) ---
@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Legacy endpoint - handles batch video upload and processing (non-streaming)."""
    
    clear_previous_session_data()
    
    if 'video' not in request.files or 'reference_images' not in request.files:
        return jsonify({"message": "Missing video or reference images."}), 400
        
    video_file = request.files['video']
    ref_files = request.files.getlist('reference_images')
    
    # Save Files
    video_filename = secure_filename(video_file.filename)
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_filename)
    video_file.save(video_path)
    
    ref_paths = []
    for i, ref_file in enumerate(ref_files):
        ref_filename = secure_filename(f"ref_{i}_{ref_file.filename}")
        ref_path = os.path.join(app.config['UPLOAD_FOLDER'], ref_filename)
        ref_file.save(ref_path)
        ref_paths.append(ref_path)

    # Start Deep Learning Processing
    processor = VideoProcessor()
    
    # Call generator function and collect results
    generator_results = list(processor.process_video_generator(video_path, ref_paths))
    
    if not generator_results:
        return jsonify({"message": "Processing failed to start."}), 500
        
    final_result = generator_results[-1] 
    
    # Generate Reports on completion
    if final_result['status'] == 'completed':
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
            "details": generator_results 
        }), 200
    else:
        # If the generator returned an error status
        return jsonify({"message": "Processing failed.", "details": final_result}), 500

# --- OTHER ROUTES ---

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

# --- LIVE FEED: Generate Report ---
@app.route('/api/live/generate-report/<session_id>', methods=['POST'])
def generate_live_report(session_id):
    """Generates CSV and PDF reports for a live feed session."""
    if session_id not in LIVE_SESSION_DATA:
        return jsonify({"message": "Session not found."}), 404
    
    session_data = LIVE_SESSION_DATA[session_id]
    video_name = session_data['video_name']
    
    # Generate reports using the same generator
    generator = ReportGenerator()
    csv_report_path = generator.generate_csv(video_name)
    pdf_report_path = generator.generate_pdf(video_name)
    
    return jsonify({
        "message": "Reports generated successfully.",
        "session_id": session_id,
        "matches_found": len(session_data['matches']),
        "frames_processed": session_data['frame_count'],
        "report_urls": {
            "csv": os.path.basename(csv_report_path) if csv_report_path else None,
            "pdf": os.path.basename(pdf_report_path) if pdf_report_path else None
        }
    }), 200

# --- LIVE FEED: Get Session Stats ---
@app.route('/api/live/stats/<session_id>', methods=['GET'])
def get_live_stats(session_id):
    """Returns current session statistics."""
    if session_id not in LIVE_SESSION_DATA:
        return jsonify({"message": "Session not found."}), 404
    
    session_data = LIVE_SESSION_DATA[session_id]
    return jsonify({
        "session_id": session_id,
        "matches_found": len(session_data['matches']),
        "frames_processed": session_data['frame_count'],
        "start_time": session_data['start_time'].isoformat(),
        "matches": session_data['matches'][-10:]  # Last 10 matches
    }), 200

@app.route('/api/static/<folder>/<filename>')
def serve_static(folder, filename):
    """Serves matched images and reports."""
    directory_to_serve = None
    if folder == 'matches':
        directory_to_serve = MATCHES_FOLDER
    elif folder == 'reports':
        directory_to_serve = REPORTS_FOLDER
    else:
        return jsonify({"message": "Not Found"}), 404
        
    return send_from_directory(directory_to_serve, filename, as_attachment=(folder == 'reports'))

if __name__ == '__main__':
    # This block is for running directly (e.g., python backend/app.py)
    # It won't be called when using 'run_server.py'
    print("🚀 Starting Flask API directly on http://127.0.0.1:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)