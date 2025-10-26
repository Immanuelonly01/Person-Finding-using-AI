// frontend/src/components/ResultsDashboard.jsx (Updated with Card and Icons)
import React, { useState, useEffect } from 'react';
import { IoFileTrayFull, IoDownload, IoAlertCircle, IoTime } from 'react-icons/io5';
import Card from './Card'; // Import Card
import { getDetectionResults, getImageUrl } from '../services/api';

const ResultsDashboard = ({ videoName, reportUrls }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getDetectionResults(videoName);
                setResults(response.data);
                if (response.data.length === 0) {
                    setError("No high-confidence matches were found for this person in the video.");
                }
            } catch (err) {
                console.error("Error fetching results:", err);
                setError("Failed to fetch results from the server. Check network connection.");
            } finally {
                setLoading(false);
            }
        };

        if (videoName) {
            fetchResults();
        }
    }, [videoName]);

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem', fontSize: '1.25rem', color: '#4f46e5' }}>
        <IoTime style={{ display: 'inline-block', marginRight: '0.5rem' }} /> Analyzing footage...
    </div>;

    if (error) return (
        <Card style={{ margin: '2rem auto', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}>
            <div style={{ display: 'flex', alignItems: 'center', color: '#ef4444', fontWeight: '600' }}>
                <IoAlertCircle size={24} style={{ marginRight: '0.5rem' }} />
                {error}
            </div>
            {results.length > 0 && <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Note: {results.length} low-confidence events may exist but were filtered.</p>}
        </Card>
    );

    return (
        <Card title={`2. Results for: ${videoName}`} style={{ margin: '2rem auto' }}>
            
            {/* Report Download Section */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', border: '1px solid #d1d5db', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}>
                <IoFileTrayFull size={24} color="#4f46e5" />
                <p style={{ fontWeight: '500', color: '#374151', paddingRight: '0.5rem' }}>Download Artifacts:</p>
                
                {reportUrls.csv && (
                    <a 
                        href={`http://localhost:5000/api/static/reports/${reportUrls.csv}`}
                        target="_blank"
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center' }}
                    >
                        <IoDownload style={{ marginRight: '0.25rem' }} /> CSV Log
                    </a>
                )}
                {reportUrls.pdf && (
                    <a 
                        href={`http://localhost:5000/api/static/reports/${reportUrls.pdf}`}
                        target="_blank"
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center' }}
                    >
                        <IoDownload style={{ marginRight: '0.25rem' }} /> PDF Report
                    </a>
                )}
            </div>

            {/* Results Grid */}
            <div className="result-grid">
                {results.map((result, index) => (
                    <div key={index} className="result-item" style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#4f46e5', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Match #{index + 1}</p>
                        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Time: <span style={{ fontWeight: '600' }}>{result.timestamp}</span> (Frame {result.frame})</p>
                        <p style={{ fontSize: '0.875rem' }}>Similarity: <span style={{ fontWeight: '600', color: '#059669' }}>{result.similarity}</span></p>
                        
                        <div style={{ marginTop: '0.75rem', height: 'auto', overflow: 'hidden' }}>
                            <img 
                                src={getImageUrl(result.image_url)} 
                                alt={`Match at frame ${result.frame}`} 
                                className="result-image"
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                        </div>
                    </div>
                ))}
            </div>
            
            {results.length > 0 && (
                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#4b5563' }}>Total Unique Detections: {results.length}</p>
            )}
        </Card>
    );
};

export default ResultsDashboard;