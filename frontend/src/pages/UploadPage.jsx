// frontend/src/pages/UploadPage.jsx
import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ResultsDashboard from '../components/ResultsDashboard';

const UploadPage = () => {
    const [videoName, setVideoName] = useState(null);
    const [reportUrls, setReportUrls] = useState(null);

    const handleProcessingComplete = (name, urls) => {
        setVideoName(name);
        setReportUrls(urls);
    };

    return (
        <div className="main-content" style={{ padding: '2rem 0' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '600', color: '#1f2937', textAlign: 'center', marginBottom: '2rem' }}>Upload & Search</h1>
            
            <FileUpload onProcessingComplete={handleProcessingComplete} />

            {videoName && reportUrls && (
                <ResultsDashboard videoName={videoName} reportUrls={reportUrls} />
            )}

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
};

export default UploadPage;