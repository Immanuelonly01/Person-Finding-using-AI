// frontend/src/components/FileUpload.jsx (LIGHT THEME VERSION)
import React, { useState } from 'react';
import { IoSearch, IoImage, IoVideocamOutline, IoTime, IoStatsChart } from 'react-icons/io5';
import Card from './Card';
import { uploadAndProcess } from '../services/api';
import { logSearchJob } from '../services/firebaseService';
import { useOutletContext } from 'react-router-dom';

const FileUpload = () => {
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
        refImages.forEach(img => {
            formData.append('reference_images', img);
        });

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
                await logSearchJob(finalDetails, videoFilename, fullReportUrls);
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

    return (
        <Card title="1. Start Automated Search" style={{ maxWidth: '40rem', margin: '2rem auto', backgroundColor: '#fff', color: '#222' }}>
            
            {/* Video Upload */}
            <div style={{
                marginBottom: '1rem',
                border: videoFile ? '2px solid #0078D7' : '2px dashed #ccc',
                padding: '1rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#fafafa'
            }}>
                <IoVideocamOutline size={24} color="#0078D7" style={{ marginRight: '1rem' }} />
                <div style={{ flexGrow: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#222' }}>CCTV Video (.mp4, .avi)</label>
                    <input type="file" onChange={(e) => setVideoFile(e.target.files[0])} accept="video/*" style={{ marginTop: '0.25rem', width: '100%' }} />
                    {videoFile && <p style={{ fontSize: '0.75rem', color: '#0078D7', marginTop: '0.25rem' }}>Selected: {videoFile.name}</p>}
                </div>
            </div>

            {/* Reference Images */}
            <div style={{
                marginBottom: '1.5rem',
                border: refImages.length > 0 ? '2px solid #0078D7' : '2px dashed #ccc',
                padding: '1rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#fafafa'
            }}>
                <IoImage size={24} color="#0078D7" style={{ marginRight: '1rem' }} />
                <div style={{ flexGrow: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#222' }}>Reference Images (Target Person)</label>
                    <input type="file" multiple onChange={(e) => setRefImages(Array.from(e.target.files))} accept="image/*" style={{ marginTop: '0.25rem', width: '100%' }} />
                    {refImages.length > 0 && <p style={{ fontSize: '0.75rem', color: '#0078D7', marginTop: '0.25rem' }}>{refImages.length} image(s) selected.</p>}
                </div>
            </div>

            {/* Upload Button */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                    onClick={handleUpload}
                    disabled={loading || !videoFile || refImages.length === 0 || !user.isAuthenticated}
                    style={{
                        backgroundColor: user.isAuthenticated ? '#0078D7' : '#bbb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem 1.5rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: '0.3s'
                    }}
                >
                    <IoSearch style={{ marginRight: '0.5rem' }} />
                    {loading ? "ANALYZING..." : (user.isAuthenticated ? "START AUTOMATED SEARCH" : "LOGIN REQUIRED")}
                </button>
            </div>

            {/* Progress Bar */}
            {(loading || statusMessage.includes('failed')) && (
                <div style={{ width: '100%', marginTop: '1rem', textAlign: 'center' }}>
                    <p style={{
                        fontSize: '0.875rem',
                        color: statusMessage.includes('failed') ? '#c0392b' : '#0078D7',
                        marginBottom: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <IoTime style={{ marginRight: '0.5rem' }} /> {statusMessage} ({displayProgress.toFixed(0)}%)
                    </p>
                    {loading && displayProgress < 100 && (
                        <div style={{
                            width: '100%',
                            backgroundColor: '#eee',
                            borderRadius: '9999px',
                            height: '0.5rem'
                        }}>
                            <div style={{
                                backgroundColor: '#0078D7',
                                height: '0.5rem',
                                borderRadius: '9999px',
                                width: `${displayProgress}%`,
                                transition: 'width 0.5s'
                            }}></div>
                        </div>
                    )}
                </div>
            )}

            {/* Sequential Log */}
            {sequentialResults.length > 0 && (
                <Card style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>
                    <h4 style={{
                        color: '#222',
                        borderBottom: '1px solid #ddd',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <IoStatsChart style={{ marginRight: '0.5rem', color: '#0078D7' }} /> Real-Time Log ({sequentialResults.length})
                    </h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {sequentialResults.slice().reverse().map((match, index) => (
                            <p key={index} style={{
                                fontSize: '0.8rem',
                                color: match.similarity >= 0.75 ? '#0078D7' : '#555',
                                padding: '0.2rem 0'
                            }}>
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
