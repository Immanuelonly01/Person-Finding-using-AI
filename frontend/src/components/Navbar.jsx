// frontend/src/components/Navbar.jsx (Finalized with Auth Logic)
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoHome, IoCloudUpload, IoVideocam, IoInformationCircle, IoStatsChart, IoLogIn, IoLogOut } from 'react-icons/io5';
import { logoutUser } from '../services/firebaseService'; // Import the logout function

// Navbar now accepts the user object as a prop
const Navbar = ({ user }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logoutUser();
            alert("Logged out successfully.");
            navigate('/');
        } catch (error) {
            console.error("Logout failed:", error);
            alert("Logout failed. See console.");
        }
    };

    const navItems = [
        { name: 'Home', path: '/', icon: IoHome },
        { name: 'Upload Search', path: '/upload', icon: IoCloudUpload },
        // Dashboard link requires the user to be signed in
        { name: 'Dashboard', path: '/dashboard', icon: IoStatsChart, requiresAuth: true }, 
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
                    
                    {/* Primary Navigation Links */}
                    {navItems.map((item) => {
                        // Conditionally render Dashboard link
                        if (item.requiresAuth && !user.isAuthenticated) {
                            return null;
                        }
                        return (
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
                        );
                    })}
                    
                    {/* AUTH BUTTONS: Conditional rendering */}
                    {user.isAuthenticated ? (
                        <button onClick={handleLogout} 
                            style={{ 
                                border: 'none', 
                                background: 'transparent', 
                                color: 'var(--neon-pink)', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center',
                                padding: '0.5rem 0.75rem', 
                            }}
                            onMouseOver={e => { e.currentTarget.style.color = 'var(--text-strong)'; e.currentTarget.style.textShadow = '0 0 10px var(--neon-pink)'; }}
                            onMouseOut={e => { e.currentTarget.style.color = 'var(--neon-pink)'; e.currentTarget.style.textShadow = 'none'; }}
                        >
                            <IoLogOut style={{ marginRight: '0.3rem' }} /> Logout
                        </button>
                    ) : (
                        <Link to="/auth" 
                            style={{ 
                                color: 'var(--neon-cyan)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                fontWeight: 'bold',
                                padding: '0.5rem 0.75rem',
                                border: '1px solid var(--neon-cyan)',
                                borderRadius: '4px',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseOver={e => { e.target.style.backgroundColor = 'rgba(0, 255, 209, 0.1)'; }}
                            onMouseOut={e => { e.target.style.backgroundColor = 'transparent'; }}
                        >
                            <IoLogIn style={{ marginRight: '0.3rem' }} /> Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;