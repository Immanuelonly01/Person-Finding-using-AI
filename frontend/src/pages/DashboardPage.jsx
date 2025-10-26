// frontend/src/pages/DashboardPage.jsx (Finalized)
import React from 'react';
import Card from '../components/Card';
import { IoBarChartOutline, IoDocumentText, IoDownload, IoAlertCircle } from 'react-icons/io5';

const DashboardPage = () => {
    // Placeholder data representing the LAST successful batch run result.
    const lastVideoName = "LAST_PROCESSED_VIDEO.mp4"; 
    const lastReportUrls = {
        csv: `report_${lastVideoName.split('.')[0]}.csv`,
        pdf: `report_${lastVideoName.split('.')[0]}.pdf`,
    };

    return (
        <div style={{ padding: '2rem 1rem' }}>
            <h1 style={{ color: 'var(--color-text-primary)', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>
                <IoBarChartOutline style={{ marginRight: '0.5rem', color: 'var(--color-accent)' }} />
                System Dashboard & Analytics
            </h1>
            
            <Card style={{ maxWidth: '60rem', margin: '0 auto', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Project Status Overview</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
                    The system is operating smoothly. The core Deep Learning pipeline (YOLO + FaceNet) is active and ready for synchronous batch processing or real-time streaming.
                </p>
                <ul style={{ color: 'var(--color-text-secondary)', listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '1rem' }}>
                    <li>**API Status:** Active (http://localhost:5000)</li>
                    <li>**Last Successful Batch Run:** {lastVideoName}</li>
                </ul>
            </Card>

            <Card title="Download Last Run Reports" style={{ maxWidth: '60rem', margin: '0 auto' }}>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Artifacts from the last successful batch search are available below. These files are regenerated upon every new upload.
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
                    
                    {/* Download CSV Button */}
                    <a 
                        href={`http://localhost:5000/api/static/reports/${lastReportUrls.csv}`}
                        target="_blank"
                        style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '8px', textDecoration: 'none', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
                    >
                        <IoDownload style={{ marginRight: '0.5rem' }} /> CSV Log
                    </a>

                    {/* Download PDF Button */}
                    <a 
                        href={`http://localhost:5000/api/static/reports/${lastReportUrls.pdf}`}
                        target="_blank"
                        style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ff6b6b', color: 'white', borderRadius: '8px', textDecoration: 'none', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
                    >
                        <IoDownload style={{ marginRight: '0.5rem' }} /> PDF Report
                    </a>
                </div>
            </Card>
        </div>
    );
};

export default DashboardPage;