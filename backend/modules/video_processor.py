import cv2
import os
import sqlite3
from datetime import timedelta
import uuid
import numpy as np
import traceback

# --- CRITICAL FIX: Use Absolute Imports to prevent circular import crashes ---
from backend.config import (
    DB_PATH, FRAME_SKIP, MATCHES_FOLDER, 
    SIMILARITY_THRESHOLD, MATCH_COOLDOWN_FRAMES # <-- Import new cooldown variable
)
from backend.modules.face_recognition_pipeline import FaceRecognitionPipeline 
from backend.modules.matcher import Matcher
# -------------------------------------------------------------------------


class VideoProcessor:
    """Orchestrates the DL pipeline: Detect+Align+Embed → Match → Log."""
    
    def __init__(self):
        self.FRAME_SKIP = FRAME_SKIP
        self.pipeline = FaceRecognitionPipeline() 
        self.matcher = Matcher(threshold=SIMILARITY_THRESHOLD) 
        # --- NEW: Add cooldown from config ---
        self.MATCH_COOLDOWN = MATCH_COOLDOWN_FRAMES
        # -----------------------------------

    def _log_detection(self, video_filename, frame_num, timestamp, similarity, match_image_path):
        """Insert detection info into SQLite database safely."""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO detections (video_filename, frame_number, timestamp, similarity, match_image_path)
                VALUES (?, ?, ?, ?, ?)
            ''', (video_filename, frame_num, timestamp, similarity, match_image_path))
            conn.commit()
        except Exception as db_err:
            print(f"⚠️ Database log failed for frame {frame_num}: {db_err}")
            traceback.print_exc()
        finally:
            if conn:
                conn.close()

    def process_video_generator(self, video_path: str, reference_image_paths: list):
        """Main processing loop — yields status, progress, and matches."""
        video_filename = os.path.basename(video_path)
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            yield {"status": "error", "message": "Could not open video file."}
            return

        # --- UPDATED: reference_embedding is now a LIST ---
        reference_embedding = self.pipeline.get_reference_embedding(reference_image_paths)
        if reference_embedding is None:
            yield {"status": "error", "message": "Could not generate reference embedding from provided images."}
            return
        # ----------------------------------------------

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_count = 0
        matches_found = 0
        
        # --- NEW: Add state to track the last match ---
        # Initialize to allow a match on frame 0
        last_match_frame = -self.MATCH_COOLDOWN - 1 
        # ----------------------------------------------
        
        yield {"status": "start", "total_frames": total_frames, "filename": video_filename}
        print(f"🔄 Starting video processing: {video_filename}. Total Frames: {total_frames}")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Yield progress (no change here)
            if frame_count % 50 == 0 or frame_count == total_frames - 1:
                yield {"status": "progress", "frame_number": frame_count}

            # Process every Nth frame
            if frame_count % self.FRAME_SKIP == 0:
                current_time_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
                time_delta = timedelta(milliseconds=current_time_ms)
                timestamp_str = str(time_delta).split('.')[0]

                all_face_data_in_frame = self.pipeline.process_frame(frame)

                # --- NEW: Track if we found a match *in this frame* ---
                found_match_in_this_frame = False
                # -----------------------------------------------------

                for face_data in all_face_data_in_frame:
                    target_embedding = face_data['embedding']
                    
                    # Matcher now checks against a LIST of reference embeddings
                    similarity, is_match = self.matcher.match(target_embedding, reference_embedding)

                    # --- UPDATED MATCH LOGIC ---
                    # Check if:
                    # 1. It IS a match
                    # 2. We are NOT in the cooldown period
                    if is_match and (frame_count > last_match_frame + self.MATCH_COOLDOWN):
                        
                        found_match_in_this_frame = True
                        matches_found += 1
                        
                        unique_id = uuid.uuid4().hex[:8]
                        match_filename = f"{video_filename.split('.')[0]}_F{frame_count}_{unique_id}.jpg"
                        match_path = os.path.join(MATCHES_FOLDER, match_filename)

                        try:
                            cv2.imwrite(match_path, face_data['cropped_image'])
                            self._log_detection(
                                video_filename,
                                frame_count,
                                timestamp_str,
                                float(similarity),
                                match_filename
                            )
                            print(f"🔥 Match Logged! Frame: {frame_count}, Sim: {similarity:.4f}")

                            yield {
                                "status": "match",
                                "frame_number": frame_count,
                                "similarity": float(similarity),
                                "timestamp": timestamp_str
                            }
                        except Exception as e:
                            print(f"⚠️ Warning: Failed to save image for frame {frame_count}. Error: {e}")
                            traceback.print_exc()
                        
                        # Break from the inner loop to only log ONE match per frame
                        # and update the cooldown timer
                        break 
                
                # --- UPDATE THE COOLDOWN TIMER ---
                if found_match_in_this_frame:
                    last_match_frame = frame_count
                # ---------------------------------
                
            frame_count += 1

        cap.release()

        # Final yield (no change here)
        yield {
            "status": "completed",
            "frames_processed": frame_count,
            "matches_found": matches_found
        }
        print(f"✅ Processing complete. Frames: {frame_count}, Matches: {matches_found}")