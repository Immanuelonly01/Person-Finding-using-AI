"""
Test script for email notification functionality
Run this to verify email notifications are working correctly
"""

import os
import sys

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.modules.notifications import send_match_alert, notification_service

def test_email_notification():
    """Test email notification with sample data."""
    print("=" * 60)
    print("Testing Email Notification System")
    print("=" * 60)
    
    # Check configuration
    print("\n[1] Checking Email Configuration...")
    if notification_service.email_enabled:
        print(f"  [OK] Email enabled")
        print(f"  SMTP Server: {notification_service.smtp_server}:{notification_service.smtp_port}")
        print(f"  From: {notification_service.email_from}")
        print(f"  To: {notification_service.email_to}")
    else:
        print("  [WARN] Email not configured!")
        print("  Please set the following environment variables in .env:")
        print("    - EMAIL_FROM")
        print("    - EMAIL_PASSWORD (Gmail App Password)")
        print("    - EMAIL_TO")
        return False
    
    print("\n[2] Checking Telegram Configuration...")
    if notification_service.telegram_enabled:
        print(f"  [OK] Telegram enabled")
        print(f"  Bot Token: {notification_service.telegram_bot_token[:10]}...")
        print(f"  Chat ID: {notification_service.telegram_chat_id}")
    else:
        print("  [WARN] Telegram not configured!")
        print("  Please set the following environment variables in .env:")
        print("    - TELEGRAM_BOT_TOKEN")
        print("    - TELEGRAM_CHAT_ID")
    
    # Test sending alert
    print("\n[3] Sending Test Alert...")
    try:
        result = send_match_alert(
            video_name="test_video.mp4",
            frame_number=100,
            timestamp="00:01:30",
            similarity=0.85,
            person_name="Test Person"
        )
        
        print("\n[4] Results:")
        print(f"  Email sent: {'[OK]' if result['email_sent'] else '[FAILED]'}")
        print(f"  Telegram sent: {'[OK]' if result['telegram_sent'] else '[FAILED]'}")
        print(f"  Timestamp: {result['timestamp']}")
        
        if result['email_sent'] or result['telegram_sent']:
            print("\n[SUCCESS] Notification test completed!")
            return True
        else:
            print("\n[FAILED] No notifications were sent. Check your configuration.")
            return False
            
    except Exception as e:
        print(f"\n[ERROR] Failed to send notification: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_email_notification()
    sys.exit(0 if success else 1)

