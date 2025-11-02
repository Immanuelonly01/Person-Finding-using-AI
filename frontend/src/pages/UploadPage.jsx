import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ResultsDashboard from '../components/ResultsDashboard'; 

const UploadPage = () => {
    const [videoName, setVideoName] = useState(null);
    const [reportUrls, setReportUrls] = useState(null);
    
    // --- 1. ADD STATE FOR RESET KEY ---
    // This key will force the FileUpload component to remount when changed
    const [uploadResetKey, setUploadResetKey] = useState(0);

    const handleProcessingComplete = (name, urls) => {
        setVideoName(name);
        setReportUrls(urls);
    };

    // --- 2. CREATE A NEW HANDLER FOR THE BUTTON ---
    const handleStartNewSearch = () => {
        // Clear the results dashboard state
        setVideoName(null);
        setReportUrls(null);
        // Increment the key. This destroys the old FileUpload and creates a new one.
        setUploadResetKey(prevKey => prevKey + 1);
    };

    return (
        <div className="main-content" style={{ padding: '2rem 0' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--text-strong)', textAlign: 'center', marginBottom: '2rem' }}>Upload & Search</h1>
            
            {/* --- 3. PASS THE KEY PROP TO FILEUPLOAD --- */}
            <FileUpload 
                key={uploadResetKey} 
                onProcessingComplete={handleProcessingComplete} 
            />

            {videoName && reportUrls && (
                <ResultsDashboard videoName={videoName} reportUrls={reportUrls} />
            )}

            {videoName && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        // --- 4. USE THE NEW HANDLER ---
                        onClick={handleStartNewSearch}
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