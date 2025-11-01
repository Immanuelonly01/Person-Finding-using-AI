import cv2
import os
import sqlite3
from datetime import timedelta
import uuid
import numpy as np
import traceback

# --- UPDATED IMPORTS ---
# Relative imports (correct for your project structure)
from ..config import DB_PATH, FRAME_SKIP, MATCHES_FOLDER, SIMILARITY_THRESHOLD
# Import the new unified pipeline
from .face_recognition_pipeline import FaceRecognitionPipeline 
from .matcher import Matcher
# --- REMOVED IMPORTS ---
# from .face_detector import FaceDetector  (No longer needed)
# from .face_embedder import FaceEmbedder (No longer needed)
# ------------------------


class VideoProcessor:
    """Orchestrates the DL pipeline: Detect+Align+Embed → Match → Log."""
    
    def __init__(self):
        # Attach FRAME_SKIP to instance for consistent use
        self.FRAME_SKIP = FRAME_SKIP
        
        # --- UPDATED INITIALIZATION ---
        # Instantiate the single, unified pipeline
        self.pipeline = FaceRecognitionPipeline() 
        # Matcher is initialized with the threshold from config
        self.matcher = Matcher(threshold=SIMILARITY_THRESHOLD) 
        # --- REMOVED ---
        # self.detector = FaceDetector()
        # self.embedder = FaceEmbedder()
        # ------------------------

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

        # --- UPDATED REFERENCE EMBEDDING ---
        # Use the pipeline to get the reference embedding
        reference_embedding = self.pipeline.get_reference_embedding(reference_image_paths)
        if reference_embedding is None:
            yield {"status": "error", "message": "Could not generate reference embedding from provided images."}
            return
        # ----------------------------------

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_count = 0
        matches_found = 0
        
        yield {"status": "start", "total_frames": total_frames, "filename": video_filename}
        print(f"🔄 Starting video processing: {video_filename}. Total Frames: {total_frames}")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Yield progress (no change here)
            if frame_count % 50 == 0 or frame_count == total_frames - 1:
                yield {"status": "progress", "frame_number": frame_count}

            # Process every Nth frame (no change here)
            if frame_count % self.FRAME_SKIP == 0:
                current_time_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
                time_delta = timedelta(milliseconds=current_time_ms)
                timestamp_str = str(time_delta).split('.')[0]

                best_match_in_frame = {'similarity': 0.0, 'image': None}

                # --- UPDATED PIPELINE EXECUTION ---
                # The pipeline handles detection, alignment, AND embedding in one step
                all_face_data_in_frame = self.pipeline.process_frame(frame)

                for face_data in all_face_data_in_frame:
                    target_embedding = face_data['embedding']
                    
                    similarity, is_match = self.matcher.match(target_embedding, reference_embedding)

                    if is_match and similarity > best_match_in_frame['similarity']:
                        best_match_in_frame['similarity'] = similarity
                        # Save the aligned, cropped image from the pipeline
                        best_match_in_frame['image'] = face_data['cropped_image'] 
                # ----------------------------------

                # Log and yield match if threshold met (no change in this logic block)
                if best_match_in_frame['similarity'] >= self.matcher.threshold:
                    matches_found += 1
                    similarity = best_match_in_frame['similarity']

                    unique_id = uuid.uuid4().hex[:8]
                    match_filename = f"{video_filename.split('.')[0]}_F{frame_count}_{unique_id}.jpg"
                    match_path = os.path.join(MATCHES_FOLDER, match_filename)

                    try:
                        # Save the 160x160 aligned match image
                        cv2.imwrite(match_path, best_match_in_frame['image'])

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

            frame_count += 1

        cap.release()

        # Final yield (no change here)
        yield {
            "status": "completed",
            "frames_processed": frame_count,
            "matches_found": matches_found
        }
        print(f"✅ Processing complete. Frames: {frame_count}, Matches: {matches_found}")