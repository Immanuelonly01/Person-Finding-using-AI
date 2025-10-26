// frontend/src/components/Navbar.jsx (Final Dark Theme Version)
import React from 'react';
import { Link } from 'react-router-dom';
// Removed IoSunny and IoMoon
import { IoHome, IoCloudUpload, IoVideocam, IoInformationCircle } from 'react-icons/io5'; 

// No more props needed since theme switching is removed
const Navbar = () => { 
    const navItems = [
        { name: 'Home', path: '/', icon: IoHome },
        { name: 'Upload Search', path: '/upload', icon: IoCloudUpload },
        { name: 'Live Feed (WIP)', path: '/live-feed', icon: IoVideocam },
        { name: 'About', path: '/about', icon: IoInformationCircle },
    ];

    return (
        <nav style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '1rem 2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
            <div style={{ maxWidth: '70rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ color: 'var(--color-accent)', fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
                    PersonSearch FYP
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {navItems.map((item) => (
                        <Link 
                            key={item.name} 
                            to={item.path} 
                            // Using the styles defined in index.css
                            style={{ 
                                textDecoration: 'none', 
                                padding: '0.5rem 0.75rem', 
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <item.icon style={{ marginRight: '0.5rem' }} />
                            {item.name}
                        </Link>
                    ))}
                    {/* Theme button removed */}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;