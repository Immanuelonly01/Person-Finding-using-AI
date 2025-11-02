import pandas as pd
import sqlite3
from fpdf import FPDF
# --- CRITICAL FIX: Use Absolute Imports ---
from backend.config import DB_PATH, REPORTS_FOLDER, MATCHES_FOLDER
# ----------------------------------------
import os

class ReportGenerator:
    # ... (The rest of this file is correct and unchanged) ...
    def _fetch_data(self, video_filename: str):
        conn = None
        try:
            conn = sqlite3.connect(DB_PATH)
            query = "SELECT frame_number, timestamp, similarity, match_image_path FROM detections WHERE video_filename = ? ORDER BY frame_number"
            df = pd.read_sql_query(query, conn, params=(video_filename,))
            return df
        except Exception as e:
            print(f"Error fetching report data: {e}")
            return pd.DataFrame() 
        finally:
            if conn:
                conn.close() 

    def generate_csv(self, video_filename: str):
        df = self._fetch_data(video_filename)
        if df.empty: 
            print("No data found for CSV report.")
            return None
            
        report_filename = f"report_{video_filename.split('.')[0]}.csv"
        report_path = os.path.join(REPORTS_FOLDER, report_filename)
        
        os.makedirs(REPORTS_FOLDER, exist_ok=True)
        
        df.to_csv(report_path, index=False)
        return report_path
        
    def generate_pdf(self, video_filename: str):
        df = self._fetch_data(video_filename)
        if df.empty:
            print("No data found for PDF report.")
            return None

        os.makedirs(REPORTS_FOLDER, exist_ok=True)
            
        pdf = FPDF()
        pdf.add_page()
        
        pdf.set_font("Helvetica", "B", 16)
        pdf.cell(0, 10, f"Person Search Detection Report", 0, 1, 'C')
        pdf.set_font("Helvetica", "I", 12)
        pdf.cell(0, 8, f"Video File: {video_filename}", 0, 1, 'C')
        pdf.ln(10)

        pdf.set_font("Helvetica", "B", 10)
        pdf.set_fill_color(230, 230, 230) 
        col_width_frame = 30
        col_width_time = 45
        col_width_sim = 35
        col_width_img = 80
        row_height = 25 
        
        pdf.cell(col_width_frame, 10, "Frame", 1, 0, 'C', True)
        pdf.cell(col_width_time, 10, "Timestamp", 1, 0, 'C', True)
        pdf.cell(col_width_sim, 10, "Similarity", 1, 0, 'C', True)
        pdf.cell(col_width_img, 10, "Match Preview", 1, 1, 'C', True)

        pdf.set_font("Helvetica", "", 9)
        
        for _, row in df.iterrows():
            if pdf.get_y() + row_height > 275: 
                pdf.add_page()
                pdf.set_font("Helvetica", "B", 10)
                pdf.cell(col_width_frame, 10, "Frame", 1, 0, 'C', True)
                pdf.cell(col_width_time, 10, "Timestamp", 1, 0, 'C', True)
                pdf.cell(col_width_sim, 10, "Similarity", 1, 0, 'C', True)
                pdf.cell(col_width_img, 10, "Match Preview", 1, 1, 'C', True)
                pdf.set_font("Helvetica", "", 9)
            
            start_y = pdf.get_y()
            
            pdf.multi_cell(col_width_frame, row_height, str(row['frame_number']), 1, 'C', 0)
            pdf.set_y(start_y)
            pdf.set_x(10 + col_width_frame)
            
            pdf.multi_cell(col_width_time, row_height, str(row['timestamp']), 1, 'C', 0)
            pdf.set_y(start_y)
            pdf.set_x(10 + col_width_frame + col_width_time)
            
            pdf.multi_cell(col_width_sim, row_height, f"{row['similarity']:.4f}", 1, 'C', 0)
            pdf.set_y(start_y)
            pdf.set_x(10 + col_width_frame + col_width_time + col_width_sim)

            image_path = os.path.join(MATCHES_FOLDER, row['match_image_path'])
            img_x = pdf.get_x() + 2 
            img_y = pdf.get_y() + 2 
            
            try:
                if os.path.exists(image_path):
                    pdf.image(image_path, x=img_x, y=img_y, h=row_height - 4) 
                else:
                    pdf.set_y(start_y + row_height/2 - 3)
                    pdf.set_x(img_x)
                    pdf.cell(col_width_img, 6, "[Image not found]", 0, 0, 'L')
            except Exception as e:
                print(f"Warning: Could not embed image {image_path}. {e}")
                pdf.set_y(start_y + row_height/2 - 3)
                pdf.set_x(img_x)
                pdf.cell(col_width_img, 6, "[Image load error]", 0, 0, 'L')

            pdf.set_y(start_y)
            pdf.set_x(10 + col_width_frame + col_width_time + col_width_sim)
            pdf.multi_cell(col_width_img, row_height, "", 1, 'C', 1) 

        report_filename = f"report_{video_filename.split('.')[0]}.pdf"
        report_path = os.path.join(REPORTS_FOLDER, report_filename)
        
        try:
            pdf.output(report_path)
            return report_path
        except Exception as e:
            print(f"Error saving PDF: {e}")
            return None