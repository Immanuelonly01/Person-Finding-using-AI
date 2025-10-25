// frontend/src/components/FileUpload.jsx (Updated with standard styles)
import React, { useState } from 'react';
import { uploadAndProcess } from '../services/api';

const FileUpload = ({ onProcessingComplete }) => {
    const [videoFile, setVideoFile] = useState(null);
    const [refImages, setRefImages] = useState([]);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!videoFile || refImages.length === 0) {
            setStatusMessage("Please select a video and at least one reference image.");
            return;
        }

        setLoading(true);
        setProgress(0);
        setStatusMessage("Uploading files...");
        
        const formData = new FormData();
        formData.append('video', videoFile);
        refImages.forEach(img => {
            formData.append('reference_images', img);
        });

        try {
            const response = await uploadAndProcess(formData, (event) => {
                setProgress(Math.round((100 * event.loaded) / event.total));
            });
            
            setStatusMessage("Upload complete. Deep Learning processing started in the backend...");
            onProcessingComplete(response.data.video_name, response.data.report_urls); 

        } catch (error) {
            console.error("Upload/Processing failed:", error);
            setStatusMessage(`Processing failed: ${error.message}. Check backend console.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>1. Upload Files for Search</h2>
            
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>CCTV Video (.mp4, .avi)</label>
                <input 
                    type="file" 
                    onChange={(e) => setVideoFile(e.target.files[0])} 
                    accept="video/*" 
                    style={{ marginTop: '0.25rem', display: 'block', width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Reference Images (Target Person)</label>
                <input 
                    type="file" 
                    multiple 
                    onChange={(e) => setRefImages(Array.from(e.target.files))} 
                    accept="image/*" 
                    style={{ marginTop: '0.25rem', display: 'block', width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
                {refImages.length > 0 && <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>{refImages.length} image(s) selected.</p>}
            </div>

            <button 
                onClick={handleUpload} 
                disabled={loading || !videoFile || refImages.length === 0}
                className="button-primary"
                style={{ backgroundColor: loading ? '#9ca3af' : '#4f46e5' }}
            >
                {loading ? "Processing..." : "Start Automated Search"}
            </button>
            
            {/* Status and Progress Bar */}
            {loading && progress < 100 && (
                <div style={{ width: '100%', marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', textAlign: 'center', color: '#4f46e5', marginBottom: '0.25rem' }}>{statusMessage}</p>
                    <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '0.5rem' }}>
                        <div style={{ backgroundColor: '#4f46e5', height: '0.5rem', borderRadius: '9999px', width: `${progress}%`, transition: 'width 0.5s' }}></div>
                    </div>
                </div>
            )}
            
            {statusMessage && !loading && (
                <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: statusMessage.includes('failed') ? '#ef4444' : '#10b981' }}>
                    {statusMessage}
                </p>
            )}
        </div>
    );
};

export default FileUpload;