// frontend/src/main.jsx (Final Setup)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Import Pages
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage'; // NEW IMPORT
import LiveFeedPage from './pages/LiveFeedPage';
import AboutPage from './pages/AboutPage';

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
                path: 'dashboard', // NEW PATH DEFINITION
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
        ],
    },
]);


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
);