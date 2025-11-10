# 🚀 Setup Guide - High-Accuracy Person Search System

## Overview

This is a **full-stack AI-powered person search system** that uses:
- **ArcFace (InsightFace)** for state-of-the-art face recognition accuracy
- **YOLOv8s-Face** for fast, accurate face detection
- **Flask** backend with Server-Sent Events (SSE) for real-time progress
- **React** frontend with Firebase authentication
- **Telegram & Email** notifications for match alerts

---

## 📋 Prerequisites

- **Python 3.8+** (3.9 or 3.10 recommended)
- **Node.js 16+** and npm
- **CUDA-capable GPU** (optional but recommended for faster processing)
- **Firebase project** (for authentication and Firestore)
- **Gmail account** (for email notifications, optional)
- **Telegram Bot Token** (for Telegram notifications, optional)

---

## 🔧 Backend Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Important Notes:**
- For **GPU support**, install `onnxruntime-gpu` instead of `onnxruntime`:
  ```bash
  pip uninstall onnxruntime
  pip install onnxruntime-gpu
  ```
- **InsightFace** will automatically download model weights on first run (~500MB)
- **YOLOv8** will download weights automatically if not found

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Email Configuration (Gmail)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Generate at: https://myaccount.google.com/apppasswords
EMAIL_TO=recipient@example.com

# Telegram Configuration
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

**To get Gmail App Password:**
1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app password for "Mail"
4. Use that password (not your regular password) in `.env`

**To get Telegram Bot Token:**
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token provided

**To get Telegram Chat ID:**
1. Message [@userinfobot](https://t.me/userinfobot) on Telegram
2. It will reply with your chat ID

### 3. Load Environment Variables

The backend uses `python-dotenv` to load `.env` files. Make sure your `.env` file is in the `backend/` directory.

### 4. Initialize Database

The database will be created automatically on first run. To manually initialize:

```bash
python backend/database/init_db.py
```

### 5. Run Backend Server

```bash
# Option 1: Using the run script
python run_server.py

# Option 2: Direct Flask run
cd backend
python app.py
```

The backend will start on `http://localhost:5000`

---

## 🎨 Frontend Setup

### 1. Install Node Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication** (Email/Password)
3. Create a **Firestore Database**
4. Update `frontend/src/services/firebaseService.js` with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Run Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

---

## 🎯 Usage

### 1. Start Both Servers

**Terminal 1 (Backend):**
```bash
python run_server.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### 2. Access the Application

Open your browser to: `http://localhost:5173`

### 3. Register/Login

- Click "Sign Up" to create an account
- Enter your email, password, first name, and last name
- After registration, you'll be automatically logged in

### 4. Upload and Process Video

1. Go to the **Upload** page
2. Select a video file (`.mp4`, `.avi`, etc.)
3. Select one or more reference images of the target person
4. Click **"START AUTOMATED SEARCH"**
5. Watch real-time progress updates via SSE streaming
6. When matches are detected, you'll receive:
   - **Email notification** (if configured)
   - **Telegram notification** (if configured)
   - **Real-time match display** in the UI

### 5. View Results

- **Dashboard**: View all your processed jobs and download reports
- **Reports**: CSV and PDF reports are generated automatically
- **Match Images**: Cropped face images are saved for each match

---

## 🔍 System Architecture

### Face Recognition Pipeline

1. **Face Detection**: YOLOv8s-Face (primary) or MTCNN (fallback)
2. **Face Alignment**: Automatic alignment via detection model
3. **Feature Extraction**: ArcFace (InsightFace) - 512-dimensional embeddings
4. **Similarity Matching**: Cosine similarity with threshold ≥ 0.75

### Processing Flow

```
Video Upload → Frame Extraction → Face Detection → ArcFace Embedding → 
Cosine Similarity Matching → Match Detection → Alert Notification → 
Report Generation
```

### Real-Time Streaming

- **Backend**: Server-Sent Events (SSE) for progress updates
- **Frontend**: EventSource API for receiving updates
- **Updates Include**: Frame progress, match detections, completion status

---

## 📊 Configuration

### Similarity Threshold

Default: **0.75** (high accuracy)

To adjust, edit `backend/config.py`:
```python
SIMILARITY_THRESHOLD = 0.75  # Increase for stricter matching, decrease for more lenient
```

### Frame Skip

Default: **10** (process every 10th frame)

To adjust, edit `backend/config.py`:
```python
FRAME_SKIP = 10  # Lower = more frames processed (slower but more thorough)
```

### Match Cooldown

Default: **30 frames** (prevents duplicate matches)

To adjust, edit `backend/config.py`:
```python
MATCH_COOLDOWN_FRAMES = 30  # Frames to wait before logging another match
```

---

## 🐛 Troubleshooting

### Backend Issues

**"InsightFace not available"**
- Install: `pip install insightface onnxruntime`
- For GPU: `pip install onnxruntime-gpu`

**"YOLOv8 not available"**
- Install: `pip install ultralytics`

**"CUDA out of memory"**
- Reduce batch size or use CPU mode
- Edit `backend/modules/face_recognition_pipeline.py` to use CPU

**Email notifications not working**
- Verify Gmail App Password (not regular password)
- Check SMTP settings in `.env`
- Ensure 2FA is enabled on Gmail account

**Telegram notifications not working**
- Verify bot token and chat ID in `.env`
- Test bot token by messaging your bot on Telegram

### Frontend Issues

**"Firebase not configured"**
- Update `frontend/src/services/firebaseService.js` with your Firebase config
- Ensure Firebase Authentication and Firestore are enabled

**"CORS errors"**
- Ensure backend is running on `http://localhost:5000`
- Check `backend/app.py` CORS configuration

**"SSE connection failed"**
- Ensure backend is running
- Check browser console for errors
- Verify `/api/process-video` endpoint is accessible

---

## 📁 Project Structure

```
Person-Finding-using-AI/
├── backend/
│   ├── app.py                    # Flask application
│   ├── config.py                 # Configuration settings
│   ├── requirements.txt          # Python dependencies
│   ├── modules/
│   │   ├── face_recognition_pipeline.py  # ArcFace + YOLOv8 pipeline
│   │   ├── video_processor.py    # Video processing logic
│   │   ├── matcher.py            # Cosine similarity matching
│   │   ├── notifications.py      # Email + Telegram alerts
│   │   └── report_generator.py   # CSV/PDF report generation
│   ├── database/
│   │   └── init_db.py            # Database initialization
│   └── static/
│       ├── uploads/              # Uploaded videos and images
│       ├── matches/              # Detected match images
│       └── reports/              # Generated reports
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx      # Login/Registration
│   │   │   ├── DashboardPage.jsx # Job history and analytics
│   │   │   ├── UploadPage.jsx    # Video upload interface
│   │   │   └── LiveFeedPage.jsx  # Real-time webcam feed
│   │   ├── components/
│   │   │   ├── FileUpload.jsx    # Upload component with SSE
│   │   │   └── ResultsDashboard.jsx
│   │   └── services/
│   │       ├── api.js            # API client with SSE support
│   │       └── firebaseService.js # Firebase integration
│   └── package.json
└── SETUP_GUIDE.md               # This file
```

---

## 🎓 Key Features

✅ **High Accuracy**: ArcFace (SOTA face recognition)  
✅ **Real-Time Progress**: SSE streaming updates  
✅ **Notifications**: Email + Telegram alerts  
✅ **User Authentication**: Firebase Auth  
✅ **Job Tracking**: Firestore database  
✅ **Report Generation**: CSV and PDF reports  
✅ **Live Feed**: Real-time webcam processing  
✅ **Modern UI**: React with dark theme  

---

## 📝 License

This project is for educational purposes (Final Year Project).

---

## 🤝 Support & Contact

For issues, questions, or collaboration opportunities:

- **Email:** [immanuelonly01@gmail.com](mailto:immanuelonly01@gmail.com)
- **LinkedIn:** [Immanuel](https://www.linkedin.com/in/immanuelonly/)
- **GitHub:** [@Immanuelonly01](https://github.com/Immanuelonly01)

**Before contacting:**
1. Check the troubleshooting section above
2. Review backend console logs
3. Check browser developer console
4. Verify all environment variables are set correctly
5. Open an issue on GitHub for bug reports

---

**Happy Searching! 🎯**

**Project by Immanuel** | Final Year Project

