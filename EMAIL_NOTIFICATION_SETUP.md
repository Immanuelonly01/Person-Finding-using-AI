# 📧 Email Notification Setup & Testing Guide

## Quick Setup

1. **Create `.env` file** in the `backend/` directory:

```env
# Email Configuration (Gmail)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_TO=recipient@example.com

# Telegram Configuration (Optional)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

2. **Get Gmail App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Generate an app password for "Mail"
   - Use that password (NOT your regular password) in `.env`

3. **Test Email Notification:**
   ```bash
   python backend/test_email_notification.py
   ```

## Features Implemented

✅ **Live Feed Report Generation**
- Matches are tracked during live feed sessions
- Reports can be generated on-demand
- CSV and PDF reports available

✅ **High-Contrast UI Theme**
- Light background with dark text for better visibility
- All text colors updated for maximum contrast
- Improved alignment and spacing throughout

✅ **Email Notifications**
- Automatic alerts when matches are detected
- Works for both batch processing and live feed
- HTML-formatted emails with match details

✅ **Enhanced Live Feed Page**
- Real-time match tracking
- Session statistics display
- Report generation button
- Download links for CSV/PDF reports

## Testing Email Notifications

Run the test script:
```bash
python backend/test_email_notification.py
```

This will:
1. Check your email configuration
2. Send a test notification
3. Report success/failure

## Troubleshooting

**Email not sending?**
- Verify Gmail App Password (not regular password)
- Check SMTP settings in `.env`
- Ensure 2FA is enabled on Gmail account
- Check backend console for error messages

**Telegram not working?**
- Verify bot token from @BotFather
- Get your chat ID from @userinfobot
- Check that bot token and chat ID are correct in `.env`

