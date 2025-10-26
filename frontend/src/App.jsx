// frontend/src/App.jsx (Cleaned up: Only Dark Theme Default)
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './index.css'; 

function App() {
    // Set Dark Theme permanently on component load
    useEffect(() => {
        document.body.className = 'dark-theme';
    }, []);

    // NOTE: Navbar will no longer receive the isDarkMode/toggleTheme props

    return (
        <div className="app-container">
            <Navbar />
            
            <main style={{ minHeight: '80vh', maxWidth: '70rem', margin: '0 auto', paddingBottom: '2rem' }}>
                <Outlet />
            </main>
            
            <Footer />
        </div>
    );
}

export default App;