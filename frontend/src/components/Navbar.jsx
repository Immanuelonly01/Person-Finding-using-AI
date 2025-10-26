// frontend/src/components/Navbar.jsx (Finalized with Dashboard Link)
import React from 'react';
import { Link } from 'react-router-dom';
import { IoHome, IoCloudUpload, IoVideocam, IoInformationCircle, IoStatsChart } from 'react-icons/io5';

const Navbar = () => {
    const navItems = [
        { name: 'Home', path: '/', icon: IoHome },
        { name: 'Upload Search', path: '/upload', icon: IoCloudUpload },
        { name: 'Dashboard', path: '/dashboard', icon: IoStatsChart }, // NEW LINK
        { name: 'Live Feed (WIP)', path: '/live-feed', icon: IoVideocam },
        { name: 'About', path: '/about', icon: IoInformationCircle },
    ];

    return (
        <nav style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid rgba(255,255,255,0.04)', backdropFilter: 'blur(6px) saturate(120%)', boxShadow: '0 6px 30px rgba(2,6,23,0.6)', padding: '1rem 2rem' }}>
            <div style={{ maxWidth: '70rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ color: 'var(--neon-cyan)', fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
                    PersonSearch FYP
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {navItems.map((item) => (
                        <Link 
                            key={item.name} 
                            to={item.path} 
                            style={{ 
                                color: 'var(--text-strong)', 
                                textDecoration: 'none', 
                                padding: '0.5rem 0.75rem', 
                                transition: 'color 0.2s, background-color 0.2s', 
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            onMouseOver={e => { e.target.style.color = 'var(--neon-cyan)'; e.target.style.textShadow = '0 0 10px var(--neon-cyan)'; }}
                            onMouseOut={e => { e.target.style.color = 'var(--text-strong)'; e.target.style.textShadow = 'none'; }}
                        >
                            <item.icon style={{ marginRight: '0.5rem' }} />
                            {item.name}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;