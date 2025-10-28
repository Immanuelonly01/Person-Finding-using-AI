// frontend/src/App.jsx (FINALIZED with Auth and Theme Logic)
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { initAuthListener } from './services/firebaseService'; // CRITICAL: Import Auth Listener
import './index.css'; 

function App() {
    // 1. User state initialized
    const [user, setUser] = useState({ uid: null, email: null, isAuthenticated: false });

    // 2. Initialize Firebase Auth Listener
    useEffect(() => {
        // This function starts listening for user changes (login/logout/token changes)
        initAuthListener(setUser); 
        
        // --- Apply Dark Theme CSS Class ---
        // Ensure the global dark theme class is applied immediately
        document.body.className = 'dark-theme'; 
    }, []);

    // NOTE: We wrap the main content in a max-width container here.

    return (
        <div className="app-container">
            {/* Pass user state to Navbar for conditional display (Login/Logout) */}
            <Navbar user={user} /> 
            
            <main style={{ minHeight: '80vh', maxWidth: '70rem', margin: '0 auto', paddingBottom: '2rem' }}>
                {/* Outlet renders the current page, passing user state via context */}
                <Outlet context={{ user }} /> 
            </main>
            
            <Footer />
        </div>
    );
}

export default App;