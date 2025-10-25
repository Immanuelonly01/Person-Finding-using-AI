// frontend/src/components/ResultsDashboard.jsx (Updated with standard styles)
import React, { useState, useEffect } from 'react';
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
                    setError("No matches found for this person in the video.");
                }
            } catch (err) {
                console.error("Error fetching results:", err);
                setError("Failed to fetch results from the server.");
            } finally {
                setLoading(false);
            }
        };

        if (videoName) {
            fetchResults();
        }
    }, [videoName]);

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem', fontSize: '1.25rem', color: '#6366f1' }}>Loading detection results...</div>;
    if (error) return <div style={{ textAlign: 'center', padding: '1rem', color: '#ef4444', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', borderRadius: '0.5rem' }}>{error}</div>;

    return (
        <div className="card" style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1f2937' }}>2. Detection Results (Video: {videoName})</h2>
            
            {/* Report Download Section */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <p style={{ fontWeight: '500', color: '#374151', paddingRight: '0.5rem' }}>Download Reports:</p>
                {reportUrls.csv && (
                    <a 
                        href={`http://localhost:5000/api/static/reports/${reportUrls.csv}`}
                        target="_blank"
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', transition: 'background-color 0.2s' }}
                    >
                        Download CSV
                    </a>
                )}
                {reportUrls.pdf && (
                    <a 
                        href={`http://localhost:5000/api/static/reports/${reportUrls.pdf}`}
                        target="_blank"
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', transition: 'background-color 0.2s' }}
                    >
                        Download PDF
                    </a>
                )}
            </div>

            {/* Results Grid */}
            <div className="result-grid">
                {results.map((result, index) => (
                    <div key={index} className="result-item">
                        <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#4f46e5' }}>Match #{index + 1}</p>
                        <p style={{ fontSize: '0.875rem' }}>Time: <span style={{ fontWeight: '600' }}>{result.timestamp}</span> (Frame {result.frame})</p>
                        <p style={{ fontSize: '0.875rem' }}>Similarity: <span style={{ fontWeight: '600', color: '#059669' }}>{result.similarity}</span></p>
                        
                        <div style={{ marginTop: '0.75rem' }}>
                            <img 
                                src={getImageUrl(result.image_url)} 
                                alt={`Match at frame ${result.frame}`} 
                                className="result-image"
                            />
                        </div>
                    </div>
                ))}
            </div>
            
            {results.length > 0 && (
                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#4b5563' }}>Total Detections: {results.length}</p>
            )}
        </div>
    );
};

export default ResultsDashboard;