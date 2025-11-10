# 🎯 High-Accuracy Automated Person Search in CCTV Footage with Real-Time Alerts

A full-stack AI-powered person search system that uses state-of-the-art deep learning models to identify and track individuals in video footage with high accuracy. Features real-time processing, live webcam feed, and automated email/Telegram notifications.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![React](https://img.shields.io/badge/React-18+-61dafb.svg)
![Flask](https://img.shields.io/badge/Flask-2.3+-000000.svg)
![ArcFace](https://img.shields.io/badge/ArcFace-SOTA-green.svg)

## ✨ Features

### 🔍 **High-Accuracy Face Recognition**
- **ArcFace (InsightFace)** - State-of-the-art face recognition with 512-dimensional embeddings
- **YOLOv8s-Face** - Fast and accurate face detection
- **MTCNN + FaceNet** - Fallback detection and recognition models
- **Similarity Threshold: 0.75+** - High accuracy matching

### 🎥 **Video Processing**
- **Batch Processing** - Upload and process video files frame-by-frame
- **Live Feed** - Real-time webcam processing with MJPEG streaming
- **Server-Sent Events (SSE)** - Real-time progress updates during processing
- **Frame-by-Frame Analysis** - Configurable frame skipping for optimal performance

### 📊 **Reporting & Analytics**
- **CSV Reports** - Detailed detection logs with timestamps and similarity scores
- **PDF Reports** - Professional reports with match images
- **Dashboard** - View all processed jobs and download reports
- **Job History** - Track all search activities in Firestore

### 🔔 **Notifications**
- **Email Alerts** - SMTP-based email notifications (Gmail supported)
- **Telegram Alerts** - Bot-based Telegram notifications
- **Real-Time Alerts** - Instant notifications when matches are detected

### 🎨 **Modern UI**
- **High-Contrast Theme** - Light theme with excellent visibility
- **Responsive Design** - Works on desktop and mobile devices
- **Real-Time Updates** - Live progress bars and match displays
- **Firebase Authentication** - Secure user login and registration

## 🏗️ Architecture

```
┌─────────────────┐
│   React Frontend │  ← User Interface (Vite + React Router)
└────────┬────────┘
         │ HTTP/SSE
┌────────▼────────┐
│  Flask Backend  │  ← API Server (REST + SSE Streaming)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│ArcFace│ │ YOLOv8s │  ← Deep Learning Models
└───────┘ └─────────┘
    │         │
┌───▼─────────▼───┐
│  Face Detection │
│  & Recognition  │
└─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Flask** - Web framework and API server
- **PyTorch** - Deep learning framework
- **InsightFace** - ArcFace face recognition
- **Ultralytics** - YOLOv8 face detection
- **OpenCV** - Video and image processing
- **SQLite** - Local database for detections
- **Firebase** - Authentication and Firestore

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Firebase SDK** - Authentication and database
- **Tailwind CSS** - Styling (via inline styles)

## 📋 Prerequisites

- **Python 3.8+** (3.9 or 3.10 recommended)
- **Node.js 16+** and npm
- **CUDA-capable GPU** (optional but recommended for faster processing)
- **Firebase project** (for authentication and Firestore)
- **Gmail account** (for email notifications, optional)
- **Telegram Bot Token** (for Telegram notifications, optional)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Immanuelonly01/Person-Finding-using-AI.git
cd Person-Finding-using-AI
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt
```

**For GPU support (optional):**
```bash
pip uninstall onnxruntime
pip install onnxruntime-gpu
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Email Configuration (Gmail)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_TO=recipient@example.com

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

**Get Gmail App Password:**
1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app password for "Mail"
4. Use that password (not your regular password) in `.env`

**Get Telegram Bot Token:**
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token provided

**Get Telegram Chat ID:**
1. Message [@userinfobot](https://t.me/userinfobot) on Telegram
2. It will reply with your chat ID

### 5. Configure Firebase

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

### 6. Run the Application

**Terminal 1 - Backend:**
```bash
python run_server.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 7. Access the Application

Open your browser to: `http://localhost:5173`

## 📖 Usage Guide

### Batch Video Processing

1. **Login/Register** - Create an account or log in
2. **Upload Video** - Go to the Upload page
3. **Select Reference Images** - Upload 1+ images of the target person
4. **Start Processing** - Click "START AUTOMATED SEARCH"
5. **Monitor Progress** - Watch real-time progress via SSE streaming
6. **View Results** - Download CSV/PDF reports when complete

### Live Feed Processing

1. **Go to Live Feed** - Navigate to the Live Feed page
2. **Upload Reference** - Select reference images of the target person
3. **Start Tracking** - Click "Start Tracking" to begin webcam feed
4. **Monitor Matches** - View real-time match detections
5. **Generate Report** - Click "Generate Report" to create reports
6. **Download Reports** - Download CSV/PDF reports

### Dashboard

- View all processed jobs
- Download reports from previous searches
- Track system status and statistics

## ⚙️ Configuration

### Similarity Threshold

Edit `backend/config.py`:
```python
SIMILARITY_THRESHOLD = 0.75  # Increase for stricter matching, decrease for more lenient
```

### Frame Skip

Edit `backend/config.py`:
```python
FRAME_SKIP = 10  # Process every Nth frame (lower = more thorough but slower)
```

### Match Cooldown

Edit `backend/config.py`:
```python
MATCH_COOLDOWN_FRAMES = 30  # Frames to wait before logging another match
```

## 🧪 Testing

### Test Email Notifications

```bash
python backend/test_email_notification.py
```

This will:
- Check your email configuration
- Send a test notification
- Report success/failure

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
│       ├── uploads/              # Uploaded videos and images (gitignored)
│       ├── matches/              # Detected match images (gitignored)
│       └── reports/              # Generated reports (gitignored)
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
├── SETUP_GUIDE.md               # Detailed setup instructions
├── EMAIL_NOTIFICATION_SETUP.md  # Email notification guide
└── README.md                    # This file
```

## 🔧 Troubleshooting

### Backend Issues

**"InsightFace not available"**
```bash
pip install insightface onnxruntime
# For GPU: pip install onnxruntime-gpu
```

**"YOLOv8 not available"**
```bash
pip install ultralytics
```

**"CUDA out of memory"**
- Reduce batch size or use CPU mode
- Edit `backend/modules/face_recognition_pipeline.py` to use CPU

**Email notifications not working**
- Verify Gmail App Password (not regular password)
- Check SMTP settings in `.env`
- Ensure 2FA is enabled on Gmail account

### Frontend Issues

**"Firebase not configured"**
- Update `frontend/src/services/firebaseService.js` with your Firebase config
- Ensure Firebase Authentication and Firestore are enabled

**"CORS errors"**
- Ensure backend is running on `http://localhost:5000`
- Check `backend/app.py` CORS configuration

## 📊 Performance

- **Face Detection:** ~30-60 FPS (GPU) / ~10-20 FPS (CPU)
- **Face Recognition:** ~50-100 FPS (GPU) / ~15-30 FPS (CPU)
- **Processing Speed:** Depends on video resolution and frame skip settings
- **Accuracy:** 95%+ with ArcFace at 0.75 threshold

## 🔐 Security

- **Environment Variables** - Sensitive data stored in `.env` (gitignored)
- **Firebase Auth** - Secure user authentication
- **Input Validation** - File type and size validation
- **CORS Protection** - Configured for specific origins

## 📝 License

This project is for educational purposes (Final Year Project).

## 👤 Author

**Immanuel**

- GitHub: [@Immanuelonly01](https://github.com/Immanuelonly01)
- LinkedIn: [Immanuel](https://www.linkedin.com/in/immanuelonly/)
- Email: [immanuelonly01@gmail.com](mailto:immanuelonly01@gmail.com)

## 🙏 Acknowledgments

- **InsightFace** - For ArcFace implementation
- **Ultralytics** - For YOLOv8 models
- **FaceNet-PyTorch** - For fallback face recognition
- **Flask** - For the web framework
- **React** - For the frontend framework

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Detailed installation and configuration
- [Email Notification Setup](EMAIL_NOTIFICATION_SETUP.md) - Email/Telegram configuration

## 🚧 Future Enhancements

- [ ] Multi-person tracking
- [ ] Face clustering and grouping
- [ ] Advanced analytics dashboard
- [ ] Mobile app support
- [ ] Cloud deployment guides
- [ ] Docker containerization
- [ ] API rate limiting
- [ ] WebSocket support for live updates

## 📞 Support & Contact

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

**Made with ❤️ for Final Year Project**

