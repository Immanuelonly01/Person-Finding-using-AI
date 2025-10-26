import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import {
  IoSearch,
  IoLayers,
  IoDocumentText,
  IoGitNetwork,
  IoArrowForward,
  IoCloudUpload,
  IoVideocam,
} from 'react-icons/io5';

const FeatureCard = ({ icon: Icon, title, description, link, isWIP = false }) => (
  <a
    href={link}
    style={{
      textDecoration: 'none',
      height: '100%',
      pointerEvents: isWIP ? 'none' : 'auto',
    }}
    tabIndex={isWIP ? -1 : 0}
  >
    <div className="feature-card fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Icon className="feature-card-icon" size={38} style={{ marginBottom: '1rem' }} />
      <h3>{title}</h3>
      <p className="feature-card-description" style={{ flexGrow: 1 }}>{description}</p>
      <span className="feature-card-cta">
        {isWIP ? 'Coming Soon' : 'View Details'} <IoArrowForward />
      </span>
    </div>
  </a>
);

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: IoSearch,
      title: 'High-Confidence Search',
      description:
        'Uses ArcFace embeddings (512D) and cosine similarity for precise identity matching with minimal error rate.',
      link: '/upload',
    },
    {
      icon: IoLayers,
      title: 'Integrated DL Pipeline',
      description:
        'Combines YOLOv8 detection, FaceNet embeddings, and Flask-based backend API for efficient orchestration.',
      link: '/about',
    },
    {
      icon: IoDocumentText,
      title: 'Automated Reporting',
      description:
        'Generate detailed CSV and PDF reports containing timestamps, similarity scores, and detected face snapshots.',
      link: '/upload',
    },
    {
      icon: IoGitNetwork,
      title: 'Modular Architecture',
      description:
        'Frontend (React) and backend (Flask) are decoupled for scalability and parallel development.',
      link: '/about',
    },
  ];

  return (
    <div style={{ padding: '2rem 1rem' }}>

      {/* ====== 1. Welcome Section ====== */}
      <Card className="section-margin-bottom text-align-center glass-card fade-in">
        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
          Welcome to the <span className="neon-text">Video Forensics System</span>
        </h2>
        <p style={{ fontSize: '1.1rem' }}>
          Upload video footage and reference images for AI-powered identity search, or explore real-time tracking possibilities.
        </p>
      </Card>

      {/* ====== 2. Start Analysis Section ====== */}
      <Card title="Start Analysis" className="section-margin-bottom glass-card fade-in">
        <div className="grid-container-fluid">
          {/* Upload Card */}
          <div className="card-flex-wrapper-1-2">
            <div className="feature-card text-align-center" onClick={() => navigate('/upload')}>
              <IoCloudUpload className="feature-card-icon" size={42} style={{ margin: '0 auto 0.5rem auto' }} />
              <h3>Upload Video Search</h3>
              <p className="feature-card-description">
                Upload CCTV or video files for frame-by-frame face analysis and similarity scoring.
              </p>
              <span className="feature-card-cta">Start Now <IoArrowForward /></span>
            </div>
          </div>

          {/* Live Feed (WIP) */}
          <div className="card-flex-wrapper-1-2">
            <FeatureCard
              icon={IoVideocam}
              title="Live Feed Tracking (WIP)"
              description="Coming soon: Real-time video streaming and live face recognition."
              link="#"
              isWIP={true}
            />
          </div>
        </div>
      </Card>

      {/* ====== 3. Core System Capabilities ====== */}
      <Card title="Core System Capabilities" className="section-margin-bottom glass-card fade-in">
        <div className="grid-container-fluid">
          {features.map((feature, index) => (
            <div key={index} className="card-flex-wrapper-1-4">
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default HomePage;
