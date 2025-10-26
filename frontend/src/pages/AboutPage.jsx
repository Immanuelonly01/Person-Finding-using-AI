// frontend/src/pages/AboutPage.jsx
import React from 'react';

const AboutPage = () => {
    return (
        <div className="card" style={{ maxWidth: '56rem', margin: '2rem auto', padding: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>About the Project</h2>
            <p style={{ color: '#4b5563' }}>
                This Final Year Project demonstrates a robust application of Computer Vision and Deep Learning techniques for forensic video analysis.
            </p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Technology Stack</h3>
            <ul style={{ listStyle: 'circle', marginLeft: '2rem', color: '#4b5563' }}>
                <li>**Backend (API & Logic):** Python, Flask, PyTorch</li>
                <li>**Deep Learning Models:** YOLOv8/v5 (Detection), FaceNet/ArcFace (Embedding)</li>
                <li>**Frontend (UI):** React, Vite, React Router DOM</li>
                <li>**Database:** SQLite3</li>
            </ul>
        </div>
    );
};

export default AboutPage;