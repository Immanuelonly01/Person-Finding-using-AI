// frontend/src/pages/DashboardPage.jsx (Enhanced with Real-Time Job Tracking)
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../components/Card';
import { 
    IoBarChartOutline, 
    IoDocumentText, 
    IoDownload, 
    IoAlertCircle, 
    IoCheckmarkCircle,
    IoTime,
    IoStatsChart,
    IoNotifications
} from 'react-icons/io5';
import { fetchUserActivity } from '../services/firebaseService';

const DashboardPage = () => {
    const { user } = useOutletContext();
    const [userActivity, setUserActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user.isAuthenticated && user.uid) {
            loadUserActivity();
        } else {
            setLoading(false);
        }
    }, [user.isAuthenticated, user.uid]);

    const loadUserActivity = async () => {
        try {
            setLoading(true);
            const activity = await fetchUserActivity();
            setUserActivity(activity);
        } catch (error) {
            console.error('Failed to load user activity:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getReportUrl = (filename, type) => {
        if (!filename) return null;
        return `http://localhost:5000/api/static/reports/${filename}`;
    };

    return (
        <div style={{ padding: '2rem 1rem', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            <h1 style={{ 
                color: '#111827', 
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                marginBottom: '2rem', 
                textAlign: 'center' 
            }}>
                <IoBarChartOutline style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
                System Dashboard & Analytics
            </h1>
            
            {/* System Status Card */}
            <Card style={{ maxWidth: '60rem', margin: '0 auto 2rem', backgroundColor: '#ffffff', border: '2px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                    <IoStatsChart style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
                    System Status Overview
                </h2>
                <p style={{ color: '#4b5563', fontSize: '1.1rem', marginBottom: '1rem' }}>
                    High-Accuracy Person Search System powered by <strong style={{ color: '#3b82f6' }}>ArcFace</strong> and <strong style={{ color: '#3b82f6' }}>YOLOv8s-Face</strong>.
                </p>
                <ul style={{ color: '#374151', listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '1rem', lineHeight: '1.8' }}>
                    <li><strong>API Status:</strong> <span style={{ color: '#10b981', fontWeight: '600' }}>Active</span> (http://localhost:5000)</li>
                    <li><strong>Face Recognition:</strong> ArcFace (InsightFace) - SOTA Accuracy</li>
                    <li><strong>Face Detection:</strong> YOLOv8s-Face (with MTCNN fallback)</li>
                    <li><strong>Similarity Threshold:</strong> 0.75+ (High Accuracy)</li>
                    <li><strong>Notifications:</strong> Email + Telegram Alerts Enabled</li>
                </ul>
            </Card>

            {/* User Activity / Job History */}
            {user.isAuthenticated ? (
                <Card 
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', color: '#111827' }}>
                            <IoTime style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
                            Your Search History
                        </div>
                    }
                    style={{ maxWidth: '60rem', margin: '0 auto 2rem', backgroundColor: '#ffffff', border: '2px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                    {loading ? (
                        <p style={{ color: '#6b7280', textAlign: 'center' }}>Loading activity...</p>
                    ) : userActivity.length === 0 ? (
                        <p style={{ color: '#6b7280', textAlign: 'center' }}>
                            No search jobs yet. Upload a video to get started!
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {userActivity.map((job, index) => (
                                <div 
                                    key={job.id || index}
                                    style={{
                                        backgroundColor: '#f9fafb',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: '2px solid #e5e7eb',
                                        color: '#374151'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <h3 style={{ color: '#111827', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                                                {job.video_name || 'Unknown Video'}
                                            </h3>
                                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                Processed: {formatDate(job.processedAt)}
                                            </p>
                                        </div>
                                        <div style={{ 
                                            backgroundColor: job.matches_found > 0 ? '#10b981' : '#6b7280',
                                            color: '#ffffff',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            fontSize: '0.875rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {job.matches_found || 0} Match{job.matches_found !== 1 ? 'es' : ''}
                                        </div>
                                    </div>
                                    
                                    <div style={{ 
                                        display: 'flex', 
                                        gap: '0.75rem', 
                                        marginTop: '0.75rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        {job.csv_filename && (
                                            <a 
                                                href={getReportUrl(job.csv_filename, 'csv')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ 
                                                    padding: '0.75rem 1.5rem', 
                                                    backgroundColor: '#10b981', 
                                                    color: '#ffffff', 
                                                    borderRadius: '8px', 
                                                    textDecoration: 'none', 
                                                    fontSize: '0.875rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    fontWeight: '600',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            >
                                                <IoDownload /> CSV Report
                                            </a>
                                        )}
                                        {job.pdf_filename && (
                                            <a 
                                                href={getReportUrl(job.pdf_filename, 'pdf')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ 
                                                    padding: '0.75rem 1.5rem', 
                                                    backgroundColor: '#ef4444', 
                                                    color: '#ffffff', 
                                                    borderRadius: '8px', 
                                                    textDecoration: 'none', 
                                                    fontSize: '0.875rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    fontWeight: '600',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            >
                                                <IoDownload /> PDF Report
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            ) : (
                <Card style={{ maxWidth: '60rem', margin: '0 auto 2rem', backgroundColor: '#ffffff', border: '2px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <p style={{ color: '#6b7280', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <IoAlertCircle style={{ color: '#ef4444' }} />
                        Please log in to view your search history and job tracking.
                    </p>
                </Card>
            )}

            {/* Notification Status */}
            <Card 
                title={
                    <div style={{ display: 'flex', alignItems: 'center', color: '#111827' }}>
                        <IoNotifications style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
                        Alert System Status
                    </div>
                }
                style={{ maxWidth: '60rem', margin: '0 auto', backgroundColor: '#ffffff', border: '2px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
                <p style={{ color: '#374151', fontSize: '1rem', marginBottom: '1rem' }}>
                    When a person match is detected, the system automatically sends alerts via:
                </p>
                <ul style={{ color: '#4b5563', listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                    <li><strong>Email:</strong> SMTP notifications to configured recipient</li>
                    <li><strong>Telegram:</strong> Bot messages to configured chat ID</li>
                </ul>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '1rem', fontStyle: 'italic', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                    Configure notification settings in the backend <code style={{ color: '#3b82f6', backgroundColor: '#eff6ff', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>.env</code> file.
                </p>
            </Card>
        </div>
    );
};

export default DashboardPage;
