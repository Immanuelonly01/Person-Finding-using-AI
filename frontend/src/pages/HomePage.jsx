// frontend/src/pages/HomePage.jsx (Final Corrected Code)

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';

// --- CRITICAL FIX: All icons MUST be imported here ---
import { 
    IoSearch, IoLayers, IoDocumentText, IoGitNetwork, 
    IoArrowForward, IoCloudUpload, IoVideocam // ADDED IoCloudUpload and IoVideocam
} from 'react-icons/io5'; 
// ----------------------------------------------------

const FeatureCard = ({ icon: Icon, title, description, link }) => {
    return (
        <a href={link} style={{ textDecoration: 'none', width: '100%' }}>
            <div className="feature-card" style={{ padding: '1.5rem', borderRadius: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Icon className="feature-card-icon" size={36} style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', flexGrow: 1 }}>{description}</p>
                <span style={{ color: 'var(--color-accent)', marginTop: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    View Details <IoArrowForward style={{ marginLeft: '0.5rem' }}/>
                </span>
            </div>
        </a>
    );
};


const HomePage = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: IoSearch,
            title: "High-Confidence Search",
            description: "Utilizes advanced ArcFace embeddings (512D) and cosine similarity for accurate target identification.",
            link: '/upload'
        },
        {
            icon: IoLayers,
            title: "Integrated DL Pipeline",
            description: "Seamless orchestration of YOLOv8 detection, FaceNet embedding, and database logging in Python/Flask.",
            link: '/about'
        },
        {
            icon: IoDocumentText,
            title: "Automated Reporting",
            description: "Generates exportable CSV and PDF reports with timestamps, similarity scores, and cropped evidence images.",
            link: '/upload'
        },
        {
            icon: IoGitNetwork,
            title: "Modular Architecture",
            description: "Separates frontend (React) and backend (Flask API) for scalability and easy maintenance.",
            link: '/about'
        }
    ];
    
    return (
        <div style={{ padding: '2rem 1rem' }}>

            {/* 1. Welcome Content */}
            <Card style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-accent)', marginBottom: '1rem' }}>
                    Welcome to the Video Forensics System
                </h2>
                <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)' }}>
                    Start your investigation by uploading a video and a reference image, or explore future real-time tracking possibilities.
                </p>
            </Card>

            {/* 2. Action Area (Upload / Live Feed) */}
            <Card title="Start Analysis" style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    
                    <div className="feature-card-wrapper" style={{ flex: 1, minWidth: '250px' }}>
                        <div className="feature-card" onClick={() => navigate('/upload')} style={{ height: '100%', padding: '1.5rem' }}>
                            <IoCloudUpload className="feature-card-icon" size={32} />
                            <h3 style={{ color: 'var(--color-text-primary)', marginTop: '0.5rem' }}>Upload Video Search</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Process local CCTV footage frame-by-frame (Batch processing).</p>
                        </div>
                    </div>
                    
                    <div className="feature-card-wrapper" style={{ flex: 1, minWidth: '250px' }}>
                        <div className="feature-card" onClick={() => navigate('/live-feed')} style={{ height: '100%', padding: '1.5rem', opacity: 0.7 }}>
                            <IoVideocam className="feature-card-icon" size={32} />
                            <h3 style={{ color: 'var(--color-text-primary)', marginTop: '0.5rem' }}>Live Feed Tracking (WIP)</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Placeholder for real-time video streaming analysis.</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* 3. Feature Card Grid */}
            <Card title="Core System Capabilities" style={{ maxWidth: '70rem', margin: '0 auto' }}>
                <div className="feature-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card-wrapper">
                            <FeatureCard {...feature} />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default HomePage;