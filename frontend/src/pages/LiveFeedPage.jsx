// frontend/src/pages/LiveFeedPage.jsx
import React, { useState, useRef } from 'react';
import Card from '../components/Card';
import { IoCloudUpload, IoVideocam, IoPulse, IoAlertCircle } from 'react-icons/io5';

const API_LIVE_URL = 'http://localhost:5000/api/live/start';

const LiveFeedPage = () => {
    const [status, setStatus] = useState('AWAITING_REF');
    const [matchData, setMatchData] = useState([]);
    const [refImages, setRefImages] = useState([]);
    const eventSourceRef = useRef(null);
    const [lastFrame, setLastFrame] = useState(0);

    const handleStartStream = async () => {
        if (refImages.length === 0) {
            alert("Please select a reference image to begin tracking.");
            return;
        }

        setStatus('CONNECTING');
        setMatchData([]);
        setLastFrame(0);

        const formData = new FormData();
        refImages.forEach(img => formData.append('reference_images', img));

        try {
            // Use Fetch API to initiate the POST request
            const fetchResponse = await fetch(API_LIVE_URL, {
                method: 'POST',
                body: formData,
            });

            if (!fetchResponse.ok) {
                 const errorBody = await fetchResponse.json();
                 throw new Error(errorBody.message || "Failed to start stream due to server error.");
            }
            
            // 2. Start listening for the stream response
            // We use the same URL for EventSource; the server maintains state via the open connection.
            eventSourceRef.current = new EventSource(API_LIVE_URL); 

            eventSourceRef.current.onopen = () => {
                setStatus('LIVE');
            };

            eventSourceRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.status === 'error') {
                        setStatus('ERROR');
                        console.error("Stream Error:", data.message);
                        eventSourceRef.current.close();
                    } else if (data.status === 'processing') {
                        setLastFrame(data.frame);
                        if (data.matches && data.matches.length > 0) {
                            setMatchData(data.matches);
                        } else {
                            setMatchData([]);
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse SSE data:", e);
                }
            };

            eventSourceRef.current.onerror = (err) => {
                console.error("EventSource failed.", err);
                // Gracefully handle disconnection
                if (eventSourceRef.current) eventSourceRef.current.close();
                if (status === 'LIVE' || status === 'CONNECTING') {
                     setStatus('DISCONNECTED');
                }
            };

        } catch (error) {
            setStatus('ERROR');
            alert(`Error: ${error.message}`);
        }
    };

    const handleStopStream = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            setStatus('STOPPED');
            setMatchData([]);
        }
    };

    const statusMap = {
        'AWAITING_REF': { text: 'Ready to Start', color: 'var(--color-text-secondary)' },
        'CONNECTING': { text: 'Connecting...', color: 'var(--color-accent)' },
        'LIVE': { text: 'LIVE Tracking Active', color: 'var(--neon-cyan)' },
        'STOPPED': { text: 'Stream Disconnected', color: 'var(--color-border)' },
        'DISCONNECTED': { text: 'Stream Ended/Lost', color: '#ff6b6b' },
        'ERROR': { text: 'Connection Error', color: '#ff6b6b' },
    };
    
    const currentStatus = statusMap[status];

    return (
        <div style={{ padding: '2rem 1rem' }}>
            <h1 style={{ color: 'var(--color-text-primary)', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>
                <IoVideocam style={{ marginRight: '0.5rem', color: 'var(--color-accent)' }} />
                Real-Time Person Tracking (WIP)
            </h1>

            <Card style={{ maxWidth: '40rem', margin: '0 auto', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>1. Reference Setup</h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <IoCloudUpload size={24} color={currentStatus.color} />
                    <input 
                        type="file" 
                        multiple
                        onChange={(e) => setRefImages(Array.from(e.target.files))} 
                        accept="image/*" 
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
                        disabled={status === 'LIVE' || status === 'CONNECTING'}
                    />
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button 
                        onClick={handleStartStream}
                        disabled={status === 'LIVE' || status === 'CONNECTING' || refImages.length === 0}
                        className="btn-neon"
                        style={{ marginRight: '1rem', opacity: (status === 'LIVE' || status === 'CONNECTING' || refImages.length === 0) ? 0.5 : 1 }}
                    >
                        {status === 'LIVE' || status === 'CONNECTING' ? 'Tracking...' : 'Start Tracking'}
                    </button>
                    <button 
                        onClick={handleStopStream}
                        disabled={status !== 'LIVE' && status !== 'CONNECTING'}
                        style={{ padding: '0.55rem 1rem', borderRadius: '10px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                        Stop Stream
                    </button>
                </div>
            </Card>
            
            {/* 2. Results Dashboard */}
            <Card title={`2. Stream Status`} style={{ margin: '0 auto', maxWidth: '40rem', borderColor: currentStatus.color }}>
                
                <p style={{ color: currentStatus.color, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <IoPulse style={{ display: status === 'LIVE' ? 'inline-block' : 'none', marginRight: '0.5rem' }} />
                    Status: {currentStatus.text} (Frame: {lastFrame})
                </p>

                {matchData.length > 0 ? (
                    matchData.map((match, index) => (
                        <div key={index} style={{ borderBottom: '1px solid var(--color-border)', padding: '0.5rem 0' }}>
                            <p style={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>Match Found!</p>
                            <small style={{ color: 'var(--color-accent)' }}>Similarity: {match.similarity}</small>
                        </div>
                    ))
                ) : (
                    <p style={{ color: status === 'LIVE' ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                        {status === 'LIVE' ? "Searching for person in view..." : "No active stream or matches detected."}
                    </p>
                )}
            </Card>
        </div>
    );
};

export default LiveFeedPage;