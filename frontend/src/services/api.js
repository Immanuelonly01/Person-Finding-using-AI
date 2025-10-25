// D:\Projects\Final Year Project\Deploy\frontend\src\services\api.js
import axios from 'axios';

// Set the base URL to your running Flask API
const API_BASE_URL = 'http://localhost:5000/api';

export const uploadAndProcess = (formData, onUploadProgress) => {
    return axios.post(`${API_BASE_URL}/upload`, formData, {
        // Flask expects multipart/form-data for file uploads
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
    // This helper function creates the full path for matched images
    return `http://localhost:5000${imagePath}`;
};