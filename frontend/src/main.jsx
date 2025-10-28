// frontend/src/main.jsx (Final Setup with Auth Route)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Import Pages
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage'; 
import LiveFeedPage from './pages/LiveFeedPage';
import AboutPage from './pages/AboutPage';
import AuthPage from './pages/AuthPage'; // CRITICAL: Import the new Auth Page

// Define Routes
const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                path: '/',
                element: <HomePage />,
            },
            {
                path: 'upload',
                element: <UploadPage />,
            },
            {
                path: 'dashboard',
                element: <DashboardPage />,
            },
            {
                path: 'live-feed',
                element: <LiveFeedPage />,
            },
            {
                path: 'about',
                element: <AboutPage />,
            },
            {
                path: 'auth', // NEW ROUTE FOR LOGIN/REGISTER
                element: <AuthPage />,
            },
        ],
    },
]);


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
);