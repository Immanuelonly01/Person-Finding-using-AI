// frontend/src/components/FileUpload.jsx (Updated with Card component)
import React, { useState } from 'react';
import { IoSearch, IoImage, IoVideocamOutline, IoWarning } from 'react-icons/io5';
import Card from './Card'; // Import Card
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
            // Simulate the DL processing time with a short delay before fetching results
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            
            onProcessingComplete(response.data.video_name, response.data.report_urls); 

        } catch (error) {
            console.error("Upload/Processing failed:", error);
            setStatusMessage(`Processing failed: ${error.message}. Check backend console.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="1. Start Automated Search" style={{ maxWidth: '40rem', margin: '2rem auto' }}>
            
            {/* Input: Video File */}
            <div style={{ marginBottom: '1rem', border: videoFile ? '2px solid #10b981' : '2px dashed #d1d5db', padding: '1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center' }}>
                <IoVideocamOutline size={24} color="#4f46e5" style={{ marginRight: '1rem' }} />
                <div style={{ flexGrow: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>CCTV Video (.mp4, .avi)</label>
                    <input 
                        type="file" 
                        onChange={(e) => setVideoFile(e.target.files[0])} 
                        accept="video/*" 
                        style={{ marginTop: '0.25rem', width: '100%' }}
                    />
                    {videoFile && <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>Selected: {videoFile.name}</p>}
                </div>
            </div>

            {/* Input: Reference Images */}
            <div style={{ marginBottom: '1.5rem', border: refImages.length > 0 ? '2px solid #10b981' : '2px dashed #d1d5db', padding: '1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center' }}>
                <IoImage size={24} color="#4f46e5" style={{ marginRight: '1rem' }} />
                <div style={{ flexGrow: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Reference Images (Target Person)</label>
                    <input 
                        type="file" 
                        multiple 
                        onChange={(e) => setRefImages(Array.from(e.target.files))} 
                        accept="image/*" 
                        style={{ marginTop: '0.25rem', width: '100%' }}
                    />
                    {refImages.length > 0 && <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>{refImages.length} image(s) selected.</p>}
                </div>
            </div>

            {/* Submit Button */}
            <button 
                onClick={handleUpload} 
                disabled={loading || !videoFile || refImages.length === 0}
                className="button-primary"
                style={{ 
                    backgroundColor: loading ? '#9ca3af' : '#4f46e5', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: (loading || !videoFile || refImages.length === 0) ? 'not-allowed' : 'pointer'
                }}
            >
                <IoSearch style={{ marginRight: '0.5rem' }} />
                {loading ? "Processing..." : "Start Automated Search"}
            </button>
            
            {/* Status and Progress Bar */}
            {statusMessage && (
                <div style={{ width: '100%', marginTop: '1rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.875rem', color: loading ? '#4f46e5' : statusMessage.includes('failed') ? '#ef4444' : '#10b981', marginBottom: '0.25rem' }}>
                         {statusMessage.includes('failed') && <IoWarning style={{ display: 'inline-block', marginRight: '0.25rem' }} />}
                         {statusMessage}
                    </p>
                    {loading && progress < 100 && (
                        <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '0.5rem' }}>
                            <div style={{ backgroundColor: '#4f46e5', height: '0.5rem', borderRadius: '9999px', width: `${progress}%`, transition: 'width 0.5s' }}></div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default FileUpload;