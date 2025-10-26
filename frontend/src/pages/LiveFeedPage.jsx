// frontend/src/pages/LiveFeedPage.jsx
import React from 'react';

const LiveFeedPage = () => {
    return (
        <div className="card" style={{ maxWidth: '56rem', margin: '2rem auto', padding: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Live Feed Search (Future Scope)</h2>
            <p style={{ color: '#4b5563' }}>
                This feature would typically involve continuously streaming frames from a webcam or RTSP feed to the backend and returning real-time matches. This requires a dedicated video streaming protocol (like WebSockets) and optimized models for low latency.
            </p>
            <p style={{ color: '#ef4444', marginTop: '1rem', fontWeight: 'bold' }}>Status: Implementation is still pending (WIP).</p>
        </div>
    );
};

export default LiveFeedPage;