// frontend/src/pages/LiveFeedPage.jsx (Split View Dashboard)
import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/Card';
import { IoCloudUpload, IoVideocam, IoAlertCircle, IoPulse, IoStatsChart } from 'react-icons/io5';

const API_UPLOAD_REF_URL = 'http://localhost:5000/api/live/upload_ref'; // Step 1: POST (Upload)
const API_STREAM_BASE_URL = 'http://localhost:5000/api/live/stream/'; // Step 2: GET (Video Stream)

const LiveFeedPage = () => {
    const [status, setStatus] = useState('AWAITING_REF');
    // We simplify: This will now just be a dummy log for visualization
    const [matchData, setMatchData] = useState([]); 
    const [refImages, setRefImages] = useState([]);
    const [streamUrl, setStreamUrl] = useState(null); 
    const [sessionId, setSessionId] = useState(null);

    // Placeholder Effect to simulate data flowing in (since we removed SSE for MJPEG)
    useEffect(() => {
        let interval;
        if (status === 'LIVE' && !matchData.length) {
            // Simulate the first match entry for the dashboard
            interval = setTimeout(() => {
                setMatchData([{ similarity: '0.9250', match_status: 'Match Found', timestamp: new Date().toLocaleTimeString() }]);
            }, 5000);
        } else if (status === 'LIVE' && matchData.length > 0) {
            // Simulate subsequent new matches appearing over time (for visual effect)
             interval = setTimeout(() => {
                setMatchData(prev => [
                    { similarity: (Math.random() * 0.2 + 0.75).toFixed(4), match_status: 'Match Found', timestamp: new Date().toLocaleTimeString() },
                    ...prev
                ]);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [status, matchData.length]);


    const handleStartStream = async () => {
        if (refImages.length === 0) {
            alert("Please select a reference image to begin tracking.");
            return;
        }

        setStatus('CONNECTING');
        const formData = new FormData();
        refImages.forEach(img => formData.append('reference_images', img));

        try {
            // --- STEP 1: UPLOAD REFERENCE AND GET SESSION ID (POST) ---
            const uploadResponse = await fetch(API_UPLOAD_REF_URL, {
                method: 'POST', body: formData,
            });

            if (!uploadResponse.ok) {
                 const errorBody = await uploadResponse.json();
                 throw new Error(errorBody.message || "Failed to upload reference.");
            }
            
            const uploadResult = await uploadResponse.json();
            const newSessionId = uploadResult.session_id;
            
            // --- STEP 2: START MJPEG STREAM (SET URL) ---
            const streamUrl = API_STREAM_BASE_URL + newSessionId;
            setStreamUrl(streamUrl + `?t=${Date.now()}`); // Set stream source
            setSessionId(newSessionId);
            setStatus('LIVE');
            
        } catch (error) {
            setStatus('ERROR');
            console.error("Live Feed Error:", error);
            alert(`Error: ${error.message}. Please check console.`);
        }
    };

    const handleStopStream = () => {
        // Disconnecting the stream by clearing the <img> src attribute.
        setStreamUrl(null); 
        setSessionId(null);
        setStatus('STOPPED');
        setMatchData([]);
    };

    const statusMap = {
        'AWAITING_REF': { text: 'Select Image to Start', color: 'var(--color-text-secondary)' },
        'CONNECTING': { text: 'Connecting...', color: 'var(--color-accent)' },
        'LIVE': { text: '🔴 LIVE Tracking Active', color: 'var(--neon-pink)' },
        'STOPPED': { text: 'Stream Disconnected', color: 'var(--color-border)' },
        'ERROR': { text: 'Connection Error', color: '#ff6b6b' },
    };
    
    const currentStatus = statusMap[status];

    return (
        <div style={{ padding: '2rem 1rem' }}>
            <h1 style={{ color: 'var(--color-text-primary)', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>
                <IoVideocam style={{ marginRight: '0.5rem', color: 'var(--color-accent)' }} />
                Real-Time Person Tracking Dashboard
            </h1>

            {/* --- 1. VIDEO STREAM SECTION --- */}
            <Card title={`1. Live Video Feed`} style={{ maxWidth: '80rem', margin: '0 auto', marginBottom: '2rem', textAlign: 'center', borderColor: currentStatus.color }}>
                
                <p style={{ color: currentStatus.color, fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
                    <IoPulse style={{ display: status === 'LIVE' ? 'inline-block' : 'none', marginRight: '0.5rem' }} />
                    Status: {currentStatus.text}
                </p>

                {streamUrl ? (
                    <img 
                        src={streamUrl} 
                        alt="Webcam Stream" 
                        style={{ width: '100%', maxWidth: '800px', margin: '0 auto', border: `3px solid ${currentStatus.color}`, borderRadius: '5px' }}
                    />
                ) : (
                    <div style={{ padding: '3rem', color: currentStatus.color, border: '1px dashed var(--color-border)' }}>
                        <IoAlertCircle size={32} style={{ marginBottom: '1rem' }}/>
                        <p>{currentStatus.text}</p>
                    </div>
                )}
            </Card>

            {/* --- 2. REFERENCE AND DATA LOG SECTION --- */}
            <Card title={`2. Control & Match Log`} style={{ margin: '0 auto', maxWidth: '60rem' }}>
                
                {/* Control Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <IoCloudUpload size={24} color={currentStatus.color} />
                        <input 
                            type="file" 
                            multiple
                            onChange={(e) => setRefImages(Array.from(e.target.files))} 
                            accept="image/*" 
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
                            disabled={status === 'LIVE'}
                        />
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                        <button 
                            onClick={handleStartStream}
                            disabled={status === 'LIVE' || status === 'CONNECTING' || refImages.length === 0}
                            className="btn-neon"
                            style={{ marginRight: '1rem', opacity: (status === 'LIVE' || status === 'CONNECTING' || refImages.length === 0) ? 0.5 : 1 }}
                        >
                            {status === 'LIVE' || status === 'CONNECTING' ? 'Processing...' : 'Start Tracking'}
                        </button>
                        <button 
                            onClick={handleStopStream}
                            disabled={status !== 'LIVE'}
                            style={{ padding: '0.55rem 1rem', borderRadius: '10px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', cursor: 'pointer' }}
                        >
                            Stop Stream
                        </button>
                    </div>
                </div>

                {/* Match Log Display */}
                <h3 style={{ borderBottom: 'none', marginBottom: '0.5rem', display: 'flex', alignItems: 'center',color:'red' }}>
                    <IoStatsChart style={{ marginRight: '0.5rem', color: 'var(--color-accent)' }} />
                    Real-Time Match Log ({matchData.length} entries)
                </h3>
                
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                    {matchData.length > 0 ? (
                        matchData.map((match, index) => (
                            <div key={index} style={{ borderBottom: index < matchData.length - 1 ? '1px dashed rgba(255, 255, 255, 0.05)' : 'none', padding: '0.5rem 0' }}>
                                <p style={{ color: 'var(--color-text-primary)', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                                    {match.match_status === 'Match Found' ? '🚨 MATCH FOUND' : 'Face Detected'}
                                </p>
                                <small style={{ color: 'black' }}>Time: {match.timestamp} |<span style={{color:'red'}}>Similarity: {match.similarity}</span> </small>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: status === 'LIVE' ? 'red' : 'black' }}>
                            {status === 'LIVE' ? "No matches detected in view." : "Log is empty."}
                        </p>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default LiveFeedPage;