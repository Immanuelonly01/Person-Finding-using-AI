import pandas as pd
import sqlite3
from fpdf import FPDF
from ..config import DB_PATH, REPORTS_FOLDER, MATCHES_FOLDER
import os

class ReportGenerator:
    """Generates CSV and PDF reports from database detection logs."""

    def _fetch_data(self, video_filename: str):
        """Fetches all detections for a specific video."""
        conn = sqlite3.connect(DB_PATH)
        query = "SELECT frame_number, timestamp, similarity, match_image_path FROM detections WHERE video_filename = ? ORDER BY frame_number"
        df = pd.read_sql_query(query, conn, params=(video_filename,))
        conn.close()
        return df

    def generate_csv(self, video_filename: str):
        """Generates a CSV report."""
        df = self._fetch_data(video_filename)
        if df.empty: return None
            
        report_filename = f"report_{video_filename.split('.')[0]}.csv"
        report_path = os.path.join(REPORTS_FOLDER, report_filename)
        df.to_csv(report_path, index=False)
        return report_path
        
    def generate_pdf(self, video_filename: str):
        """Generates a PDF report with image previews."""
        df = self._fetch_data(video_filename)
        if df.empty: return None
            
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", "B", 16)
        pdf.cell(0, 10, f"Person Search Detection Report: {video_filename}", 0, 1, 'C')
        pdf.set_font("Arial", "", 10)
        
        for _, row in df.iterrows():
            pdf.ln(2)
            pdf.set_font("Arial", "B", 10)
            pdf.cell(0, 5, f"Frame: {row['frame_number']} | Time: {row['timestamp']} | Similarity: {row['similarity']:.4f}", 0, 1, 'L')
            
            # Embed image preview
            image_path = os.path.join(MATCHES_FOLDER, row['match_image_path'])
            if os.path.exists(image_path):
                try:
                    # Check available space before adding image
                    if pdf.get_y() + 25 > 280: # If near the bottom of a typical A4 page
                        pdf.add_page()
                    pdf.image(image_path, x=10, y=pdf.get_y(), w=20)
                    pdf.ln(25) 
                except Exception:
                    pdf.ln(5)

        report_filename = f"report_{video_filename.split('.')[0]}.pdf"
        report_path = os.path.join(REPORTS_FOLDER, report_filename)
        pdf.output(report_path, "F")
        return report_path