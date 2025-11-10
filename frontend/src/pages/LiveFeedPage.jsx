// frontend/src/pages/LiveFeedPage.jsx (Enhanced with Report Generation)
import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/Card';
import { IoCloudUpload, IoVideocam, IoAlertCircle, IoPulse, IoStatsChart, IoDownload, IoStopCircle } from 'react-icons/io5';

const API_UPLOAD_REF_URL = 'http://localhost:5000/api/live/upload_ref';
const API_STREAM_BASE_URL = 'http://localhost:5000/api/live/stream/';
const API_STATS_URL = 'http://localhost:5000/api/live/stats/';
const API_GENERATE_REPORT_URL = 'http://localhost:5000/api/live/generate-report/';

const LiveFeedPage = () => {
    const [status, setStatus] = useState('AWAITING_REF');
    const [matchData, setMatchData] = useState([]); 
    const [refImages, setRefImages] = useState([]);
    const [streamUrl, setStreamUrl] = useState(null); 
    const [sessionId, setSessionId] = useState(null);
    const [sessionStats, setSessionStats] = useState({ matches_found: 0, frames_processed: 0 });
    const [reportUrls, setReportUrls] = useState(null);
    const statsIntervalRef = useRef(null);

    // Poll for session stats when live
    useEffect(() => {
        if (status === 'LIVE' && sessionId) {
            const fetchStats = async () => {
                try {
                    const response = await fetch(`${API_STATS_URL}${sessionId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setSessionStats({
                            matches_found: data.matches_found || 0,
                            frames_processed: data.frames_processed || 0
                        });
                        // Update match data from API
                        if (data.matches && data.matches.length > 0) {
                            setMatchData(data.matches.map(m => ({
                                similarity: m.similarity.toFixed(4),
                                match_status: 'Match Found',
                                timestamp: m.timestamp || new Date(m.datetime).toLocaleTimeString()
                            })));
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch stats:', error);
                }
            };
            
            fetchStats(); // Initial fetch
            statsIntervalRef.current = setInterval(fetchStats, 2000); // Poll every 2 seconds
        } else {
            if (statsIntervalRef.current) {
                clearInterval(statsIntervalRef.current);
                statsIntervalRef.current = null;
            }
        }
        
        return () => {
            if (statsIntervalRef.current) {
                clearInterval(statsIntervalRef.current);
            }
        };
    }, [status, sessionId]);

    const handleStartStream = async () => {
        if (refImages.length === 0) {
            alert("Please select a reference image to begin tracking.");
            return;
        }

        setStatus('CONNECTING');
        setMatchData([]);
        setReportUrls(null);
        const formData = new FormData();
        refImages.forEach(img => formData.append('reference_images', img));

        try {
            const uploadResponse = await fetch(API_UPLOAD_REF_URL, {
                method: 'POST', 
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorBody = await uploadResponse.json();
                throw new Error(errorBody.message || "Failed to upload reference.");
            }
            
            const uploadResult = await uploadResponse.json();
            const newSessionId = uploadResult.session_id;
            
            const streamUrl = API_STREAM_BASE_URL + newSessionId;
            setStreamUrl(streamUrl + `?t=${Date.now()}`);
            setSessionId(newSessionId);
            setStatus('LIVE');
            
        } catch (error) {
            setStatus('ERROR');
            console.error("Live Feed Error:", error);
            alert(`Error: ${error.message}. Please check console.`);
        }
    };

    const handleStopStream = () => {
        setStreamUrl(null); 
        setSessionId(null);
        setStatus('STOPPED');
        setMatchData([]);
        setSessionStats({ matches_found: 0, frames_processed: 0 });
    };

    const handleGenerateReport = async () => {
        if (!sessionId) {
            alert("No active session. Start tracking first.");
            return;
        }

        try {
            const response = await fetch(`${API_GENERATE_REPORT_URL}${sessionId}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error("Failed to generate report.");
            }

            const data = await response.json();
            setReportUrls(data.report_urls);
            alert(`Reports generated! Found ${data.matches_found} matches.`);
        } catch (error) {
            console.error("Report generation error:", error);
            alert(`Error generating report: ${error.message}`);
        }
    };

    const statusMap = {
        'AWAITING_REF': { text: 'Select Image to Start', color: '#6b7280' },
        'CONNECTING': { text: 'Connecting...', color: '#3b82f6' },
        'LIVE': { text: 'LIVE Tracking Active', color: '#10b981' },
        'STOPPED': { text: 'Stream Disconnected', color: '#6b7280' },
        'ERROR': { text: 'Connection Error', color: '#ef4444' },
    };
    
    const currentStatus = statusMap[status];

    return (
        <div style={{ padding: '2rem 1rem', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            <h1 style={{ 
                color: '#111827', 
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                marginBottom: '2rem', 
                textAlign: 'center' 
            }}>
                <IoVideocam style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
                Real-Time Person Tracking Dashboard
            </h1>

            {/* Video Stream Section */}
            <Card title="1. Live Video Feed" style={{ 
                maxWidth: '80rem', 
                margin: '0 auto 2rem', 
                textAlign: 'center', 
                backgroundColor: '#ffffff',
                border: `2px solid ${currentStatus.color}`,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    marginBottom: '1rem',
                    gap: '1rem'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: status === 'LIVE' ? '#10b981' : '#6b7280',
                        color: '#ffffff',
                        borderRadius: '0.5rem',
                        fontWeight: 'bold'
                    }}>
                        {status === 'LIVE' && <IoPulse style={{ animation: 'pulse 2s infinite' }} />}
                        Status: {currentStatus.text}
                    </div>
                    {status === 'LIVE' && (
                        <div style={{ 
                            padding: '0.5rem 1rem', 
                            backgroundColor: '#f3f4f6', 
                            borderRadius: '0.5rem',
                            color: '#111827',
                            fontWeight: '600'
                        }}>
                            Matches: {sessionStats.matches_found} | Frames: {sessionStats.frames_processed}
                        </div>
                    )}
                </div>

                {streamUrl ? (
                    <img 
                        src={streamUrl} 
                        alt="Webcam Stream" 
                        style={{ 
                            width: '100%', 
                            maxWidth: '800px', 
                            margin: '0 auto', 
                            border: `3px solid ${currentStatus.color}`, 
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                    />
                ) : (
                    <div style={{ 
                        padding: '3rem', 
                        color: '#6b7280', 
                        border: '2px dashed #d1d5db',
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb'
                    }}>
                        <IoAlertCircle size={48} style={{ marginBottom: '1rem', color: '#9ca3af' }}/>
                        <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{currentStatus.text}</p>
                    </div>
                )}
            </Card>

            {/* Control & Match Log Section */}
            <Card title="2. Control & Match Log" style={{ 
                margin: '0 auto 2rem', 
                maxWidth: '60rem',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                
                {/* Control Inputs */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1rem', 
                    marginBottom: '2rem', 
                    paddingBottom: '1.5rem', 
                    borderBottom: '2px solid #e5e7eb' 
                }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <IoCloudUpload size={24} color="#3b82f6" />
                        <input 
                            type="file" 
                            multiple
                            onChange={(e) => setRefImages(Array.from(e.target.files))} 
                            accept="image/*" 
                            style={{ 
                                width: '100%', 
                                padding: '0.75rem', 
                                border: '2px solid #d1d5db', 
                                borderRadius: '8px',
                                fontSize: '1rem',
                                backgroundColor: '#ffffff',
                                color: '#111827'
                            }}
                            disabled={status === 'LIVE'}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button 
                            onClick={handleStartStream}
                            disabled={status === 'LIVE' || status === 'CONNECTING' || refImages.length === 0}
                            style={{
                                padding: '0.75rem 2rem',
                                borderRadius: '8px',
                                backgroundColor: status === 'LIVE' || status === 'CONNECTING' || refImages.length === 0 ? '#9ca3af' : '#3b82f6',
                                color: '#ffffff',
                                border: 'none',
                                cursor: status === 'LIVE' || status === 'CONNECTING' || refImages.length === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '1rem',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                        >
                            {status === 'LIVE' || status === 'CONNECTING' ? 'Processing...' : 'Start Tracking'}
                        </button>
                        <button 
                            onClick={handleStopStream}
                            disabled={status !== 'LIVE'}
                            style={{ 
                                padding: '0.75rem 2rem', 
                                borderRadius: '8px', 
                                backgroundColor: status !== 'LIVE' ? '#9ca3af' : '#ef4444', 
                                color: '#ffffff', 
                                border: 'none', 
                                cursor: status !== 'LIVE' ? 'not-allowed' : 'pointer',
                                fontSize: '1rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <IoStopCircle /> Stop Stream
                        </button>
                        {status === 'LIVE' && (
                            <button 
                                onClick={handleGenerateReport}
                                style={{ 
                                    padding: '0.75rem 2rem', 
                                    borderRadius: '8px', 
                                    backgroundColor: '#10b981', 
                                    color: '#ffffff', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <IoDownload /> Generate Report
                            </button>
                        )}
                    </div>
                </div>

                {/* Match Log Display */}
                <h3 style={{ 
                    borderBottom: '2px solid #e5e7eb',
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    display: 'flex', 
                    alignItems: 'center',
                    color: '#111827',
                    fontSize: '1.25rem',
                    fontWeight: '600'
                }}>
                    <IoStatsChart style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
                    Real-Time Match Log ({matchData.length} entries)
                </h3>
                
                <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto', 
                    border: '2px solid #e5e7eb', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb'
                }}>
                    {matchData.length > 0 ? (
                        matchData.map((match, index) => (
                            <div 
                                key={index} 
                                style={{ 
                                    borderBottom: index < matchData.length - 1 ? '1px solid #e5e7eb' : 'none', 
                                    padding: '0.75rem 0',
                                    backgroundColor: '#ffffff',
                                    marginBottom: '0.5rem',
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb'
                                }}
                            >
                                <p style={{ 
                                    color: '#111827', 
                                    fontWeight: 'bold', 
                                    marginBottom: '0.25rem',
                                    fontSize: '1rem'
                                }}>
                                    {match.match_status === 'Match Found' ? '🔴 MATCH FOUND' : 'Face Detected'}
                                </p>
                                <small style={{ 
                                    color: '#6b7280',
                                    fontSize: '0.875rem'
                                }}>
                                    Time: {match.timestamp} | 
                                    <span style={{color: '#ef4444', fontWeight: '600', marginLeft: '0.5rem'}}>
                                        Similarity: {match.similarity}
                                    </span>
                                </small>
                            </div>
                        ))
                    ) : (
                        <p style={{ 
                            color: status === 'LIVE' ? '#6b7280' : '#9ca3af',
                            textAlign: 'center',
                            padding: '2rem',
                            fontSize: '1rem'
                        }}>
                            {status === 'LIVE' ? "No matches detected yet. Waiting for detection..." : "Log is empty. Start tracking to see matches."}
                        </p>
                    )}
                </div>

                {/* Report Download Section */}
                {reportUrls && (reportUrls.csv || reportUrls.pdf) && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        backgroundColor: '#f0fdf4',
                        border: '2px solid #10b981',
                        borderRadius: '8px'
                    }}>
                        <h4 style={{ color: '#111827', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                            Reports Generated Successfully
                        </h4>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {reportUrls.csv && (
                                <a 
                                    href={`http://localhost:5000/api/static/reports/${reportUrls.csv}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        backgroundColor: '#10b981',
                                        color: '#ffffff',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    <IoDownload /> Download CSV
                                </a>
                            )}
                            {reportUrls.pdf && (
                                <a 
                                    href={`http://localhost:5000/api/static/reports/${reportUrls.pdf}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        backgroundColor: '#ef4444',
                                        color: '#ffffff',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    <IoDownload /> Download PDF
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </Card>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default LiveFeedPage;
