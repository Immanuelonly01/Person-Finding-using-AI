// frontend/src/pages/AuthPage.jsx (FINALIZED LOGIN/REGISTER CODE)
import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom'; // Added useOutletContext
import Card from '../components/Card';
import { IoLogIn, IoPersonAdd, IoAlertCircle } from 'react-icons/io5';
import { loginUser, registerUser } from '../services/firebaseService';

const AuthPage = () => {
    // Get user from context to check if authentication succeeded globally
    const { user } = useOutletContext(); 
    
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // 1. Automatic Redirection upon successful authentication
    useEffect(() => {
        if (user.isAuthenticated) {
            navigate('/upload', { replace: true }); // Redirect to Upload Page after successful login
        }
    }, [user.isAuthenticated, navigate]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                // Login attempt
                await loginUser(email, password);
                // SUCCESS: Listener in App.jsx detects change and triggers useEffect redirect
                
            } else {
                // Register attempt
                await registerUser(email, password);
                // SUCCESS: Listener in App.jsx detects change and triggers useEffect redirect
            }
        } catch (err) {
            console.error(err);
            // Display clean Firebase error message
            setError(err.message.replace('Firebase: ', '').replace(/\(auth.*\)/, '')); 
        }
    };

    // If the user is already authenticated (but somehow on this page), redirect immediately
    if (user.isAuthenticated) {
        return null; 
    }

    return (
        <div style={{ padding: '2rem 1rem' }}>
            <Card title={isLogin ? "Sign In" : "Create Account"} style={{ maxWidth: '400px', margin: '2rem auto' }}>
                <form onSubmit={handleSubmit}>
                    <h2 style={{ color: 'var(--text-strong)', marginBottom: '1rem', display: 'flex', alignItems: 'center', fontSize: '1.5rem' }}>
                        {isLogin ? <IoLogIn style={{ marginRight: '0.5rem', color: 'var(--neon-blue)' }} /> : <IoPersonAdd style={{ marginRight: '0.5rem', color: 'var(--neon-pink)' }} />}
                        {isLogin ? "Sign In" : "Register"}
                    </h2>

                    {error && (
                        <div style={{ backgroundColor: 'rgba(255, 45, 149, 0.1)', border: '1px solid var(--neon-pink)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', color: 'var(--neon-pink)' }}>
                            <IoAlertCircle style={{ marginRight: '0.5rem' }} /> {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)' }}>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.75rem' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)' }}>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '0.75rem' }} />
                    </div>
                    
                    <button type="submit" className="btn-neon" style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem' }}>
                        {isLogin ? "Log In" : "Create Account"}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
                    {isLogin ? "Need an account?" : "Already registered?"}{' '}
                    <span onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--neon-cyan)', cursor: 'pointer', fontWeight: 'bold' }}>
                        {isLogin ? "Sign Up" : "Log In"}
                    </span>
                </p>
            </Card>
        </div>
    );
};

export default AuthPage;