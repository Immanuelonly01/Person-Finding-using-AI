// frontend/src/pages/AuthPage.jsx (UPDATED for Name Fields)
import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Card from '../components/Card';
import { IoLogIn, IoPersonAdd, IoAlertCircle } from 'react-icons/io5';
import { loginUser, registerUser, saveUserName } from '../services/firebaseService'; // NEW IMPORT: saveUserName

const AuthPage = () => {
    const { user } = useOutletContext(); 
    
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState(''); // NEW STATE
    const [lastName, setLastName] = useState(''); // NEW STATE
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Define the color for text visibility
    const DARK_TEXT_COLOR = '#1f2937'; 
    const LIGHT_ACCENT_COLOR = 'var(--neon-cyan)'; 

    // Automatic Redirection upon successful authentication
    useEffect(() => {
        if (user.isAuthenticated) {
            navigate('/upload', { replace: true });
        }
    }, [user.isAuthenticated, navigate]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                await loginUser(email, password);
            } else {
                // --- REGISTRATION LOGIC ---
                const userCredential = await registerUser(email, password);
                
                // Store Name in Firestore after successful Firebase Auth
                await saveUserName(userCredential.user.uid, firstName, lastName);
            }
        } catch (err) {
            console.error(err);
            setError(err.message.replace('Firebase: ', '').replace(/\(auth.*\)/, '')); 
        }
    };

    if (user.isAuthenticated) {
        return null; 
    }

    return (
        <div style={{ padding: '2rem 1rem' }}>
            <Card title={isLogin ? "Sign In" : "Create Account"} style={{ maxWidth: '400px', margin: '2rem auto' }}>
                <form onSubmit={handleSubmit}>
                    <h2 style={{ color: DARK_TEXT_COLOR, marginBottom: '1rem', display: 'flex', alignItems: 'center', fontSize: '1.5rem' }}>
                        {isLogin ? <IoLogIn style={{ marginRight: '0.5rem', color: 'var(--neon-blue)' }} /> : <IoPersonAdd style={{ marginRight: '0.5rem', color: 'var(--neon-pink)' }} />}
                        {isLogin ? "Sign In" : "Register"}
                    </h2>

                    {error && (
                        <div style={{ backgroundColor: 'rgba(255, 45, 149, 0.1)', border: '1px solid var(--neon-pink)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', color: 'var(--neon-pink)' }}>
                            <IoAlertCircle style={{ marginRight: '0.5rem' }} /> {error}
                        </div>
                    )}

                    {/* --- NAME FIELDS (Only for Registration) --- */}
                    {!isLogin && (
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: DARK_TEXT_COLOR }}>First Name</label>
                                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required={!isLogin} style={{ width: '100%', padding: '0.75rem', color: DARK_TEXT_COLOR, background: 'rgba(255,255,255,0.8)' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: DARK_TEXT_COLOR }}>Last Name</label>
                                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required={!isLogin} style={{ width: '100%', padding: '0.75rem', color: DARK_TEXT_COLOR, background: 'rgba(255,255,255,0.8)' }} />
                            </div>
                        </div>
                    )}

                    {/* Email and Password Fields */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: DARK_TEXT_COLOR }}>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.75rem', color: DARK_TEXT_COLOR, background: 'rgba(255,255,255,0.8)' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: DARK_TEXT_COLOR }}>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '0.75rem', color: DARK_TEXT_COLOR, background: 'rgba(255,255,255,0.8)' }} />
                    </div>
                    
                    <button type="submit" className="btn-neon" style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem' }}>
                        {isLogin ? "Log In" : "Create Account"}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: DARK_TEXT_COLOR }}>
                    {isLogin ? "Need an account?" : "Already registered?"}{' '}
                    <span onClick={() => setIsLogin(!isLogin)} style={{ color: LIGHT_ACCENT_COLOR, cursor: 'pointer', fontWeight: 'bold' }}>
                        {isLogin ? "Sign Up" : "Log In"}
                    </span>
                </p>
            </Card>
        </div>
    );
};

export default AuthPage;