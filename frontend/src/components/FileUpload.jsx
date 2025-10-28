// frontend/src/components/FileUpload.jsx (FINALIZED WITH PROGRESS & LOGGING)
import React, { useState } from 'react';
import { IoSearch, IoImage, IoVideocamOutline, IoWarning, IoTime, IoStatsChart } from 'react-icons/io5';
import Card from './Card'; 
import { uploadAndProcess } from '../services/api';
import { logSearchJob } from '../services/firebaseService'; // CRITICAL for logging
import { useOutletContext } from 'react-router-dom'; // CRITICAL for user access

const FileUpload = () => {
    // Get user from context to check authentication status
    const { user } = useOutletContext(); 

    const [videoFile, setVideoFile] = useState(null);
    const [refImages, setRefImages] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0); // Stage 1: Upload %
    const [processingPercent, setProcessingPercent] = useState(0); // Stage 2: Processing %
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sequentialResults, setSequentialResults] = useState([]); // Stage 3: Sequential Matches Log

    const handleUpload = async () => {
        if (!user.isAuthenticated) { // Check isAuthenticated flag (safer than checking uid)
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
        refImages.forEach(img => {
            formData.append('reference_images', img);
        });

        try {
            // --- STAGE 1: File Upload Progress ---
            const response = await uploadAndProcess(formData, (event) => {
                setUploadProgress(Math.round((100 * event.loaded) / event.total));
            });
            
            // Backend processing starts immediately, response contains generator data
            setStatusMessage("2/3: Analyzing video frames...");

            // --- STAGE 2 & 3: Process and Display Sequential Results ---
            
            // NOTE: The backend must be updated to return the generator output as a complete array.
            const generatorResults = response.data.details;
            const fullReportUrls = response.data.report_urls;
            const videoFilename = response.data.video_name;

            let totalFrames = 1;
            let finalDetails = {};

            // Loop through the collected results from the backend generator
            generatorResults.forEach((item) => {
                if (item.status === 'start') {
                    totalFrames = item.total_frames;
                } else if (item.status === 'progress') {
                    setProcessingPercent(Math.round((item.frame_number / totalFrames) * 100));
                } else if (item.status === 'match') {
                    // Log match sequentially for user feedback
                    setSequentialResults(prev => [item, ...prev]); 
                } else if (item.status === 'completed') {
                    finalDetails = item;
                    setProcessingPercent(100);
                    setStatusMessage(`3/3: Analysis Complete. Found ${item.matches_found} detections.`);
                }
            });

            // Log job to Firestore
            if (user.uid) {
                await logSearchJob(finalDetails, videoFilename, fullReportUrls);
            }
            
            // Hand off control to the ResultsDashboard
            onProcessingComplete(videoFilename, fullReportUrls, finalDetails); 

        } catch (error) {
            console.error("Upload/Processing failed:", error);
            setStatusMessage(`Processing failed: ${error.message}. Check backend console.`);
        } finally {
            setLoading(false);
        }
    };

    const displayProgress = (uploadProgress < 100) ? uploadProgress : processingPercent;

    return (
        <Card title="1. Start Automated Search" style={{ maxWidth: '40rem', margin: '2rem auto' }}>
            
            {/* Input: Video File (Styling omitted for brevity, remains the same) */}
            <div style={{ marginBottom: '1rem', border: videoFile ? '2px solid var(--neon-cyan)' : '2px dashed var(--color-border)', padding: '1rem', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center' }}>
                <IoVideocamOutline size={24} color="var(--neon-blue)" style={{ marginRight: '1rem' }} />
                <div style={{ flexGrow: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-strong)' }}>CCTV Video (.mp4, .avi)</label>
                    <input type="file" onChange={(e) => setVideoFile(e.target.files[0])} accept="video/*" style={{ marginTop: '0.25rem', width: '100%' }} />
                    {videoFile && <p style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', marginTop: '0.25rem' }}>Selected: {videoFile.name}</p>}
                </div>
            </div>

            {/* Input: Reference Images (Styling omitted for brevity, remains the same) */}
            <div style={{ marginBottom: '1.5rem', border: refImages.length > 0 ? '2px solid var(--neon-cyan)' : '2px dashed var(--color-border)', padding: '1rem', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center' }}>
                <IoImage size={24} color="var(--neon-blue)" style={{ marginRight: '1rem' }} />
                <div style={{ flexGrow: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-strong)' }}>Reference Images (Target Person)</label>
                    <input type="file" multiple onChange={(e) => setRefImages(Array.from(e.target.files))} accept="image/*" style={{ marginTop: '0.25rem', width: '100%' }} />
                    {refImages.length > 0 && <p style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', marginTop: '0.25rem' }}>{refImages.length} image(s) selected.</p>}
                </div>
            </div>

            {/* Submit Button */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button 
                    onClick={handleUpload} 
                    disabled={loading || !videoFile || refImages.length === 0 || !user.isAuthenticated}
                    className="btn-neon-search"
                >
                    <IoSearch style={{ marginRight: '0.5rem' }} />
                    {loading ? "ANALYZING..." : (user.isAuthenticated ? "START AUTOMATED SEARCH" : "LOGIN REQUIRED")}
                </button>
            </div>
            
            {/* --- PROGRESS BAR SECTION (FIXED SYNTAX) --- */}
            {(loading || statusMessage.includes('failed')) && (
                <div style={{ width: '100%', marginTop: '1rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.875rem', color: statusMessage.includes('failed') ? 'var(--neon-pink)' : 'var(--neon-cyan)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <IoTime style={{ marginRight: '0.5rem' }} /> {statusMessage} ({displayProgress.toFixed(0)}%)
                    </p>
                    {loading && displayProgress < 100 && (
                        <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '9999px', height: '0.5rem' }}>
                            {/* FIX: Corrected the width property syntax from 'width' to width */}
                            <div style={{ backgroundColor: 'var(--neon-cyan)', height: '0.5rem', borderRadius: '9999px', width: `${displayProgress}%`, transition: 'width 0.5s' }}></div>
                        </div>
                    )}
                </div>
            )}
            
            {/* --- SEQUENTIAL REAL-TIME MATCH DISPLAY --- */}
            {sequentialResults.length > 0 && (
                <Card style={{ marginTop: '1.5rem', padding: '1rem' }}>
                    <h4 style={{ color: 'var(--text-strong)', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                         <IoStatsChart style={{ marginRight: '0.5rem', color: 'var(--neon-cyan)' }}/> Real-Time Log ({sequentialResults.length})
                    </h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {sequentialResults.slice().reverse().map((match, index) => (
                            <p key={index} style={{ fontSize: '0.8rem', color: match.similarity >= 0.75 ? 'var(--neon-cyan)' : 'var(--muted)', padding: '0.2rem 0' }}>
                                [Frame {match.frame_number}] Match found (Sim: {match.similarity.toFixed(4)})
                            </p>
                        ))}
                    </div>
                </Card>
            )}
            
        </Card>
    );
};

export default FileUpload;