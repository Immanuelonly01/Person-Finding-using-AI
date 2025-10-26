// frontend/src/pages/DashboardPage.jsx
import React from 'react';
import Card from '../components/Card';
import { IoBarChartOutline, IoAlertCircle } from 'react-icons/io5';

const DashboardPage = () => {
    return (
        <div style={{ padding: '2rem 1rem' }}>
            <h1 style={{ color: 'var(--text-strong)', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>
                <IoBarChartOutline style={{ marginRight: '0.5rem', color: 'var(--neon-cyan)' }} />
                System Dashboard & Analytics
            </h1>
            
            <Card style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--text-strong)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                    Project Status Overview
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>
                    This section, in a production environment, would display key metrics such as Total Videos Processed, Average Processing Time, and a list of recent high-confidence detections.
                </p>
                <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid var(--neon-cyan)', backgroundColor: 'rgba(0, 255, 200, 0.05)' }}>
                    <p style={{ color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center' }}>
                        <IoAlertCircle style={{ marginRight: '0.5rem' }}/>
                        Note: For current functionality, please use the **Upload Search** page to run a new search and view immediate results.
                    </p>
                </div>
            </Card>

            <Card title="Latest Detection Statistics" style={{ opacity: 0.7 }}>
                 <p style={{ color: 'var(--muted)' }}>
                    Data visualization components (charts, graphs) would load here, showing performance and results from the database.
                 </p>
            </Card>
        </div>
    );
};

export default DashboardPage;