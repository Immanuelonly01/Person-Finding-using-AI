// frontend/src/components/Navbar.jsx (Finalized with Stable Hover and Auth Logic)
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoHome, IoCloudUpload, IoVideocam, IoInformationCircle, IoStatsChart, IoLogIn, IoLogOut } from 'react-icons/io5';
import { logoutUser } from '../services/firebaseService'; // Import the logout function

// Utility component to handle the link hover state correctly
const NavItemWrapper = ({ item, user, handleLogout }) => {
    const isLogout = item.name === 'Logout';
    
    // Determine the base style based on authentication needs
    const baseLinkStyle = { 
        color: item.path === '/auth' ? 'var(--neon-cyan)' : 'var(--text-strong)', 
        textDecoration: 'none', 
        padding: '0.5rem 0.75rem', 
        transition: 'color 0.2s, text-shadow 0.2s, background-color 0.2s', 
        display: 'flex',
        alignItems: 'center',
        fontWeight: item.path === '/auth' ? 'bold' : 'normal',
        border: item.path === '/auth' ? '1px solid var(--neon-cyan)' : 'none',
        borderRadius: '4px',
        margin: item.path === '/auth' ? '0 0.5rem' : '0',
    };

    const handleHover = (e, isOver) => {
        const target = isLogout ? e.currentTarget : e.target;
        target.style.color = isOver ? 'var(--neon-cyan)' : (isLogout ? 'var(--neon-pink)' : 'var(--text-strong)');
        target.style.textShadow = isOver ? '0 0 10px var(--neon-cyan)' : 'none';
        
        if (item.path === '/auth') {
            target.style.backgroundColor = isOver ? 'rgba(0, 255, 209, 0.1)' : 'transparent';
        }
        if (isLogout) {
            target.style.color = isOver ? 'var(--text-strong)' : 'var(--neon-pink)';
        }
    };
    
    // Handle Logout Button (using a standard button element)
    if (isLogout) {
        return (
            <button onClick={handleLogout} 
                style={{ ...baseLinkStyle, color: 'var(--neon-pink)', border: 'none', background: 'transparent' }}
                onMouseOver={(e) => handleHover(e, true)}
                onMouseOut={(e) => handleHover(e, false)}
            >
                <IoLogOut style={{ marginRight: '0.3rem' }} /> Logout
            </button>
        );
    }
    
    // Handle standard Link items
    return (
        <Link 
            to={item.path} 
            style={baseLinkStyle}
            onMouseOver={(e) => handleHover(e, true)}
            onMouseOut={(e) => handleHover(e, false)}
        >
            <item.icon style={{ marginRight: '0.5rem' }} />
            {item.name}
        </Link>
    );
};


// Navbar component
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
        { name: 'Dashboard', path: '/dashboard', icon: IoStatsChart, requiresAuth: true }, 
        { name: 'Live Feed (WIP)', path: '/live-feed', icon: IoVideocam },
        { name: 'About', path: '/about', icon: IoInformationCircle },
    ];
    
    // Conditional Auth Item
    const authItem = user.isAuthenticated 
        ? { name: 'Logout', path: '#', icon: IoLogOut, isLogout: true }
        : { name: 'Login', path: '/auth', icon: IoLogIn, isLogin: true };


    return (
        <nav style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid rgba(255,255,255,0.04)', backdropFilter: 'blur(6px) saturate(120%)', boxShadow: '0 6px 30px rgba(2,6,23,0.6)', padding: '1rem 2rem' }}>
            <div style={{ maxWidth: '70rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ color: 'var(--neon-cyan)', fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
                    PersonSearch FYP
                </Link>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    
                    {/* Primary Navigation Links */}
                    {navItems.map((item) => {
                        if (item.requiresAuth && !user.isAuthenticated) {
                            return null;
                        }
                        return <NavItemWrapper key={item.name} item={item} user={user} handleLogout={handleLogout} />;
                    })}
                    
                    {/* AUTH BUTTONS: Uses the NavItemWrapper for styling */}
                    <NavItemWrapper item={authItem} user={user} handleLogout={handleLogout} />

                </div>
            </div>
        </nav>
    );
};

export default Navbar;