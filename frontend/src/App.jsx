// frontend/src/App.jsx (Updated with standard CSS classes)
import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ResultsDashboard from './components/ResultsDashboard';
import './index.css'; // Ensure the CSS is imported

function App() {
    const [videoName, setVideoName] = useState(null);
    const [reportUrls, setReportUrls] = useState(null);

    const handleProcessingComplete = (name, urls) => {
        setVideoName(name);
        setReportUrls(urls);
    };

    return (
        <div className="app-container">
            <header className="header">
                <h1>Automated Person Search 🔍</h1>
                <p>CCTV Footage Analysis using Deep Learning</p>
            </header>

            <div className="main-content">
                {/* File Upload Component */}
                <FileUpload onProcessingComplete={handleProcessingComplete} />

                {/* Results Dashboard */}
                {videoName && reportUrls && (
                    <ResultsDashboard videoName={videoName} reportUrls={reportUrls} />
                )}
            </div>
            
            {/* Reset button for a new search */}
            {videoName && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        onClick={() => { setVideoName(null); setReportUrls(null); }}
                        style={{ padding: '0.5rem 1.5rem', backgroundColor: '#fecaca', color: '#b91c1c', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                    >
                        Start New Search
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;