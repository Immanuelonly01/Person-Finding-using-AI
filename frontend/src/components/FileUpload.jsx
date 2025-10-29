// frontend/src/components/FileUpload.jsx (Dark Theme + Grid Layout)
import React, { useState } from 'react';
import { IoSearch, IoImage, IoVideocamOutline, IoTime, IoStatsChart } from 'react-icons/io5';
import Card from './Card'; 
import { uploadAndProcess } from '../services/api';
import { logSearchJob } from '../services/firebaseService';
import { useOutletContext } from 'react-router-dom';

const FileUpload = ({ onProcessingComplete }) => {
    const { user } = useOutletContext(); 

    const [videoFile, setVideoFile] = useState(null);
    const [refImages, setRefImages] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processingPercent, setProcessingPercent] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sequentialResults, setSequentialResults] = useState([]);

    const handleUpload = async () => {
        if (!user.isAuthenticated) {
            setStatusMessage("Please log in to start automated search.");
            return;
        }
        if (!videoFile || refImages.length === 0) {
            setStatusMessage("Please select a video and at least one reference image.");
            return;
        }

        setLoading(true);
        setUploadProgress(0);
        setProcessingPercent(0);
        setSequentialResults([]);
        setStatusMessage("1/3: Uploading files to server...");
        
        const formData = new FormData();
        formData.append('video', videoFile);
        refImages.forEach(img => formData.append('reference_images', img));

        try {
            const response = await uploadAndProcess(formData, (event) => {
                setUploadProgress(Math.round((100 * event.loaded) / event.total));
            });
            
            setStatusMessage("2/3: Analyzing video frames...");

            const generatorResults = response.data.details;
            const fullReportUrls = response.data.report_urls;
            const videoFilename = response.data.video_name;

            let totalFrames = 1;
            let finalDetails = {};

            generatorResults.forEach((item) => {
                if (item.status === 'start') {
                    totalFrames = item.total_frames;
                } else if (item.status === 'progress') {
                    setProcessingPercent(Math.round((item.frame_number / totalFrames) * 100));
                } else if (item.status === 'match') {
                    setSequentialResults(prev => [item, ...prev]);
                } else if (item.status === 'completed') {
                    finalDetails = item;
                    setProcessingPercent(100);
                    setStatusMessage(`3/3: Analysis Complete. Found ${item.matches_found} detections.`);
                }
            });

            if (user.uid) {
                const reportFilenamesForLog = {
                    csv_filename: fullReportUrls.csv, 
                    pdf_filename: fullReportUrls.pdf 
                };
                await logSearchJob(finalDetails, videoFilename, reportFilenamesForLog);
            }
            
            onProcessingComplete(videoFilename, fullReportUrls, finalDetails); 

        } catch (error) {
            console.error("Upload/Processing failed:", error);
            setStatusMessage(`Processing failed: ${error.message}. Check backend console.`);
        } finally {
            setLoading(false);
        }
    };

    const displayProgress = (uploadProgress < 100) ? uploadProgress : processingPercent;
    const statusTextColor = statusMessage.includes('failed') ? '#ff3d68' : '#00ffff'; // neon pink / cyan

    return (
        <Card title="1. Start Automated Search" 
            style={{ 
                maxWidth: '45rem', 
                margin: '2rem auto', 
                backgroundColor: '#111', // Dark card background
                color: '#ddd', // Light gray text
                border: '1px solid #222',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                borderRadius: '1rem'
            }}>
            
            {/* Video Input */}
            <div style={{
                marginBottom: '1rem',
                border: videoFile ? '2px solid var(--neon-cyan)' : '2px dashed #333',
                padding: '1rem',
                borderRadius: 'var(--radius)',
                display: 'flex',
                alignItems: 'center',
                background: '#1a1a1a'
            }}>
                <IoVideocamOutline size={24} color="#00ffff" style={{ marginRight: '1rem' }} />
                <div style={{ flexGrow: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#eee' }}>
                        CCTV Video (.mp4, .avi)
                    </label>
                    <input 
                        type="file" 
                        onChange={(e) => setVideoFile(e.target.files[0])} 
                        accept="video/*"
                        style={{
                            marginTop: '0.25rem',
                            width: '100%',
                            color: '#aaa',
                            background: 'transparent',
                            border: 'none'
                        }}
                    />
                    {videoFile && (
                        <p style={{ fontSize: '0.75rem', color: '#00ffff', marginTop: '0.25rem' }}>
                            Selected: {videoFile.name}
                        </p>
                    )}
                </div>
            </div>

            {/* Reference Images */}
            <div style={{
                marginBottom: '1.5rem',
                border: refImages.length > 0 ? '2px solid var(--neon-cyan)' : '2px dashed #333',
                padding: '1rem',
                borderRadius: 'var(--radius)',
                display: 'flex',
                alignItems: 'center',
                background: '#1a1a1a'
            }}>
                <IoImage size={24} color="#007bff" style={{ marginRight: '1rem' }} />
                <div style={{ flexGrow: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#eee' }}>
                        Reference Images (Target Person)
                    </label>
                    <input 
                        type="file" 
                        multiple 
                        onChange={(e) => setRefImages(Array.from(e.target.files))} 
                        accept="image/*"
                        style={{
                            marginTop: '0.25rem',
                            width: '100%',
                            color: '#aaa',
                            background: 'transparent',
                            border: 'none'
                        }}
                    />
                    {refImages.length > 0 && (
                        <p style={{ fontSize: '0.75rem', color: '#00ffff', marginTop: '0.25rem' }}>
                            {refImages.length} image(s) selected.
                        </p>
                    )}
                </div>
            </div>

            {/* Submit Button (keep original style) */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button 
                    onClick={handleUpload} 
                    disabled={loading || !videoFile || refImages.length === 0 || !user.isAuthenticated}
                    className="btn-neon-search"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem' }}
                >
                    <IoSearch style={{ marginRight: '0.5rem' }} />
                    {loading ? "ANALYZING..." : (user.isAuthenticated ? "START AUTOMATED SEARCH" : "LOGIN REQUIRED")}
                </button>
            </div>
            
            {/* Progress Section */}
            {(loading || statusMessage.includes('failed') || displayProgress > 0) && (
                <div style={{ width: '100%', marginTop: '1rem', textAlign: 'center' }}>
                    <p style={{ 
                        fontSize: '0.875rem', 
                        color: statusTextColor, 
                        marginBottom: '0.25rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                    }}>
                        <IoTime style={{ marginRight: '0.5rem' }} /> 
                        {statusMessage} ({displayProgress.toFixed(0)}%)
                    </p>
                    {loading && displayProgress < 100 && (
                        <div style={{
                            width: '100%',
                            backgroundColor: '#222',
                            borderRadius: '9999px',
                            height: '0.5rem'
                        }}>
                            <div style={{
                                backgroundColor: '#00ffff',
                                height: '0.5rem',
                                borderRadius: '9999px',
                                width: `${displayProgress}%`,
                                transition: 'width 0.5s'
                            }}></div>
                        </div>
                    )}
                </div>
            )}

            {/* --- GRID RESULT SECTION --- */}
            {sequentialResults.length > 0 && (
                <Card style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    border: '1px solid #00ffff',
                    backgroundColor: '#161616'
                }}>
                    <h4 style={{
                        color: '#fff',
                        borderBottom: '1px solid #333',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <IoStatsChart style={{ marginRight: '0.5rem', color: '#00ffff' }} /> 
                        Real-Time Log ({sequentialResults.length})
                    </h4>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: '0.75rem',
                        maxHeight: '250px',
                        overflowY: 'auto'
                    }}>
                        {sequentialResults.map((match, index) => (
                            <div key={index} style={{
                                backgroundColor: '#1e1e1e',
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                textAlign: 'center',
                                color: match.similarity >= 0.75 ? '#00ffff' : '#777',
                                fontSize: '0.8rem',
                                border: match.similarity >= 0.75 ? '1px solid #00ffff' : '1px solid #333'
                            }}>
                                Frame {match.frame_number}<br />
                                Sim: {match.similarity.toFixed(4)}
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </Card>
    );
};

export default FileUpload;
