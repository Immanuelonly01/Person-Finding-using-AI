# D:\Projects\Final Year Project\Deploy\backend\modules\video_processor.py

import cv2
import os
import sqlite3
from datetime import timedelta
import uuid
import numpy as np

# Imports remain relative, which is correct for modules within a package
from ..config import DB_PATH, FRAME_SKIP, MATCHES_FOLDER, SIMILARITY_THRESHOLD
from .face_detector import FaceDetector
from .face_embedder import FaceEmbedder
from .matcher import Matcher

class VideoProcessor:
    """Orchestrates the DL pipeline: Detect -> Embed -> Match -> Log."""
    def __init__(self):
        self.detector = FaceDetector()
        self.embedder = FaceEmbedder()
        self.matcher = Matcher(threshold=SIMILARITY_THRESHOLD)

    def _log_detection(self, video_filename, frame_num, timestamp, similarity, match_image_path):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO detections (video_filename, frame_number, timestamp, similarity, match_image_path)
            VALUES (?, ?, ?, ?, ?)
        ''', (video_filename, frame_num, timestamp, similarity, image_path))
        conn.commit()
        conn.close()

    # --- MODIFIED: Renamed and converted to a generator function ---
    def process_video_generator(self, video_path: str, reference_image_paths: list):
        """Main processing loop, yielding progress and match data."""
        video_filename = os.path.basename(video_path)
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            yield {"status": "error", "message": "Could not open video file."}
            return

        reference_embedding = self.embedder.get_reference_embedding(reference_image_paths)
        if reference_embedding is None:
            yield {"status": "error", "message": "Could not generate reference embedding."}
            return

        # Get total frames for progress calculation
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_count = 0
        matches_found = 0
        
        # 1. INITIAL YIELD: Start signal and total frame count
        yield {"status": "start", "total_frames": total_frames, "filename": video_filename}
        
        print(f"🔄 Starting video processing: {video_filename}. Total Frames: {total_frames}")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # 2. PROGRESS YIELD: Update frontend every N frames
            if frame_count % 50 == 0 or frame_count == total_frames - 1:
                yield {"status": "progress", "frame_number": frame_count}

            if frame_count % self.FRAME_SKIP == 0:
                current_time_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
                time_delta = timedelta(milliseconds=current_time_ms)
                timestamp_str = str(time_delta).split('.')[0] 

                # --- DEDUPLICATION CORE ---
                best_match_in_frame = {'similarity': 0.0, 'image': None}
                detected_faces = self.detector.detect_faces(frame)

                for face_data in detected_faces:
                    target_embedding = self.embedder.get_embedding(face_data['image'])
                    similarity, is_match = self.matcher.match(target_embedding, reference_embedding)

                    if is_match and similarity > best_match_in_frame['similarity']:
                        best_match_in_frame['similarity'] = similarity
                        best_match_in_frame['image'] = face_data['image']
                
                # --- LOGGING & REAL-TIME MATCH YIELD ---
                if best_match_in_frame['similarity'] >= self.matcher.threshold:
                    matches_found += 1
                    similarity = best_match_in_frame['similarity']
                    
                    # Generate unique filename (for disk saving and logging)
                    unique_id = uuid.uuid4().hex[:8]
                    match_filename = f"{video_filename.split('.')[0]}_F{frame_count}_{unique_id}.jpg" 
                    match_path = os.path.join(MATCHES_FOLDER, match_filename)
                    
                    # 1. Save the image to disk (needed for final report)
                    try:
                        cv2.imwrite(match_path, best_match_in_frame['image'])
                        
                        # 2. Log to the database
                        self._log_detection(
                            video_filename, 
                            frame_count, 
                            timestamp_str, 
                            float(similarity), 
                            match_filename
                        )
                        print(f"   🔥 Match Logged! Frame: {frame_count}, Sim: {similarity:.4f}")
                        
                        # 3. YIELD MATCH RESULT (FOR SEQUENTIAL FRONTEND DISPLAY)
                        yield {
                            "status": "match",
                            "frame_number": frame_count,
                            "similarity": float(similarity),
                            "timestamp": timestamp_str
                        }

                    except Exception as e:
                        print(f"⚠️ Warning: Failed to save image for frame {frame_count}. Error: {e}")

            frame_count += 1

        cap.release()
        
        # 4. FINAL YIELD: Completion status
        yield {"status": "completed", "frames_processed": frame_count, "matches_found": matches_found}