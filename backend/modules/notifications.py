"""
Notification Module for Telegram and Email Alerts
Sends alerts when a person match is detected during video processing.
"""

import os
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Load .env from backend directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(backend_dir, '.env')
    load_dotenv(env_path)
except ImportError:
    print("[WARN] python-dotenv not installed. Environment variables must be set manually.")


class NotificationService:
    """Handles sending alerts via Email and Telegram when matches are detected."""
    
    def __init__(self):
        # Email Configuration (from environment variables)
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.email_from = os.getenv('EMAIL_FROM', '')
        self.email_password = os.getenv('EMAIL_PASSWORD', '')  # Use App Password for Gmail
        self.email_to = os.getenv('EMAIL_TO', '')
        
        # Telegram Configuration
        self.telegram_bot_token = os.getenv('TELEGRAM_BOT_TOKEN', '')
        self.telegram_chat_id = os.getenv('TELEGRAM_CHAT_ID', '')
        
        # Check if notifications are configured
        self.email_enabled = bool(self.email_from and self.email_password and self.email_to)
        self.telegram_enabled = bool(self.telegram_bot_token and self.telegram_chat_id)
        
        if not self.email_enabled and not self.telegram_enabled:
            print("[WARN] WARNING: No notification services configured. Set environment variables to enable alerts.")
        else:
            if self.email_enabled:
                print("[OK] Email notifications enabled")
            if self.telegram_enabled:
                print("[OK] Telegram notifications enabled")
    
    def send_email(self, subject: str, body: str, to: Optional[str] = None) -> bool:
        """
        Sends an email alert using SMTP.
        
        Args:
            subject: Email subject line
            body: Email body content (HTML supported)
            to: Recipient email (defaults to EMAIL_TO env var)
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.email_enabled:
            print("[WARN] Email not configured. Skipping email alert.")
            return False
        
        recipient = to or self.email_to
        
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email_from
            msg['To'] = recipient
            msg['Subject'] = subject
            
            # Create HTML email body
            html_body = f"""
            <html>
              <head></head>
              <body>
                <h2 style="color: #ff6b6b;">🚨 Person Match Detected</h2>
                {body.replace(chr(10), '<br>')}
                <hr>
                <p style="color: #666; font-size: 0.9em;">
                  <em>Sent from High-Accuracy Person Search System</em><br>
                  <em>Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</em>
                </p>
              </body>
            </html>
            """
            
            msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_from, self.email_password)
                server.send_message(msg)
            
            print(f"[OK] Email alert sent to {recipient}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to send email: {e}")
            return False
    
    def send_telegram(self, message: str, chat_id: Optional[str] = None) -> bool:
        """
        Sends a Telegram message via Bot API.
        
        Args:
            message: Message text to send
            chat_id: Telegram chat ID (defaults to TELEGRAM_CHAT_ID env var)
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.telegram_enabled:
            print("[WARN] Telegram not configured. Skipping Telegram alert.")
            return False
        
        target_chat_id = chat_id or self.telegram_chat_id
        url = f"https://api.telegram.org/bot{self.telegram_bot_token}/sendMessage"
        
        try:
            payload = {
                'chat_id': target_chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }
            
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            
            print(f"[OK] Telegram alert sent to chat {target_chat_id}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to send Telegram message: {e}")
            return False
    
    def send_match_alert(self, video_name: str, frame_number: int, timestamp: str, 
                        similarity: float, person_name: Optional[str] = None) -> dict:
        """
        Sends alerts (Email + Telegram) when a person match is detected.
        
        Args:
            video_name: Name of the video file being processed
            frame_number: Frame number where match was found
            timestamp: Video timestamp (HH:MM:SS format)
            similarity: Similarity score (0.0 to 1.0)
            person_name: Optional name of the matched person
            
        Returns:
            Dictionary with success status for each notification method
        """
        person_display = person_name or "Target Person"
        
        # Format message content
        subject = f"🚨 Person Match Detected: {person_display}"
        
        body = f"""
        <p><strong>Match Details:</strong></p>
        <ul>
          <li><strong>Person:</strong> {person_display}</li>
          <li><strong>Video:</strong> {video_name}</li>
          <li><strong>Frame:</strong> {frame_number}</li>
          <li><strong>Timestamp:</strong> {timestamp}</li>
          <li><strong>Similarity Score:</strong> {similarity:.4f} ({similarity*100:.2f}%)</li>
        </ul>
        <p style="color: #10b981; font-weight: bold;">
          ✅ High-confidence match detected! Review the video at the specified timestamp.
        </p>
        """
        
        telegram_message = f"""
🚨 <b>Person Match Detected!</b>

👤 <b>Person:</b> {person_display}
🎥 <b>Video:</b> {video_name}
📊 <b>Frame:</b> {frame_number}
⏰ <b>Timestamp:</b> {timestamp}
🎯 <b>Similarity:</b> {similarity:.4f} ({similarity*100:.2f}%)

✅ High-confidence match detected!
        """.strip()
        
        # Send both notifications
        results = {
            'email_sent': self.send_email(subject, body),
            'telegram_sent': self.send_telegram(telegram_message),
            'timestamp': datetime.now().isoformat()
        }
        
        return results


# Global instance for easy import
notification_service = NotificationService()


# Convenience functions for direct import
def send_email(to: str, subject: str, body: str) -> bool:
    """Convenience function for sending email alerts."""
    return notification_service.send_email(subject, body, to)


def send_telegram(bot_token: str, chat_id: str, message: str) -> bool:
    """Convenience function for sending Telegram alerts."""
    # Temporarily override config for this call
    original_token = notification_service.telegram_bot_token
    original_chat = notification_service.telegram_chat_id
    
    notification_service.telegram_bot_token = bot_token
    notification_service.telegram_chat_id = chat_id
    
    result = notification_service.send_telegram(message, chat_id)
    
    # Restore original config
    notification_service.telegram_bot_token = original_token
    notification_service.telegram_chat_id = original_chat
    
    return result


def send_match_alert(video_name: str, frame_number: int, timestamp: str, 
                    similarity: float, person_name: Optional[str] = None) -> dict:
    """Convenience function for sending match alerts."""
    return notification_service.send_match_alert(
        video_name, frame_number, timestamp, similarity, person_name
    )

