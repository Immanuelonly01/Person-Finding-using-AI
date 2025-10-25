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

    def _log_detection(self, video_filename, frame_num, timestamp, similarity, image_path):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO detections (video_filename, frame_number, timestamp, similarity, match_image_path)
            VALUES (?, ?, ?, ?, ?)
        ''', (video_filename, frame_num, timestamp, similarity, image_path))
        conn.commit()
        conn.close()

    def process_video(self, video_path: str, reference_image_paths: list):
        video_filename = os.path.basename(video_path)
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"status": "error", "message": "Could not open video file."}

        reference_embedding = self.embedder.get_reference_embedding(reference_image_paths)
        if reference_embedding is None:
            return {"status": "error", "message": "Could not generate reference embedding. Check reference images."}

        frame_count = 0
        print(f"🔄 Starting processing video: {video_filename}...")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break

            if frame_count % FRAME_SKIP == 0:
                current_time_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
                time_delta = timedelta(milliseconds=current_time_ms)
                timestamp_str = str(time_delta).split('.')[0] 

                # --- DUPLICATE SUPPRESSION LOGIC START ---
                best_match_in_frame = {'similarity': 0.0, 'image': None, 'box': None}
                
                detected_faces = self.detector.detect_faces(frame)

                for face_data in detected_faces:
                    target_embedding = self.embedder.get_embedding(face_data['image'])
                    similarity, is_match = self.matcher.match(target_embedding, reference_embedding)

                    if is_match:
                        # Only update the best match found in this frame
                        if similarity > best_match_in_frame['similarity']:
                            best_match_in_frame['similarity'] = similarity
                            best_match_in_frame['image'] = face_data['image']
                            best_match_in_frame['box'] = face_data['box']
                
                # Log only the single best match if it exceeds the threshold
                if best_match_in_frame['similarity'] >= SIMILARITY_THRESHOLD:
                    face_data = best_match_in_frame
                    similarity = best_match_in_frame['similarity']
                    
                    unique_id = uuid.uuid4().hex[:8]
                    # Note: Filename creation is robust and should not fail
                    match_filename = f"{video_filename.split('.')[0]}_F{frame_count}_{unique_id}.jpg" 
                    match_path = os.path.join(MATCHES_FOLDER, match_filename)
                    
                    # Ensure the image exists before logging (fixes the broken link issue)
                    try:
                        cv2.imwrite(match_path, face_data['image'])
                        self._log_detection(
                            video_filename, 
                            frame_count, 
                            timestamp_str, 
                            float(similarity), 
                            match_filename
                        )
                        print(f"   🔥 Best Match Logged! Frame: {frame_count}, Sim: {similarity:.4f}")
                    except Exception as e:
                        # Log if saving the image failed, but do not crash the pipeline
                        print(f"⚠️ Warning: Failed to save image for frame {frame_count}. Error: {e}")


            frame_count += 1

        cap.release()
        return {"status": "completed", "video_name": video_filename, "frames_processed": frame_count}