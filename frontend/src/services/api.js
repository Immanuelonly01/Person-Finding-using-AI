// D:\Projects\Final Year Project\Deploy\frontend\src\services\api.js

import axios from 'axios';

// Set the base URL to your running Flask API
const API_BASE_URL = 'http://localhost:5000/api';
const HOST_URL = 'http://localhost:5000'; // Define the host separately

export const uploadAndProcess = (formData, onUploadProgress) => {
    return axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
    });
};

export const getDetectionResults = (videoName) => {
    return axios.get(`${API_BASE_URL}/results/${videoName}`);
};

export const getImageUrl = (imagePath) => {
    // This takes the relative path (e.g., /api/static/matches/file.jpg) 
    // and prepends the host to create a working URL for the browser.
    return `${HOST_URL}${imagePath}`; 
};