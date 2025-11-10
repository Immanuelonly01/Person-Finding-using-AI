// frontend/src/services/api.js

import axios from 'axios';

// Set the base URL to your running Flask API
const API_BASE_URL = 'http://localhost:5000/api';
const HOST_URL = 'http://localhost:5000'; // Define the host separately

/**
 * Upload and process video with Server-Sent Events (SSE) streaming
 * @param {FormData} formData - Form data with video and reference images
 * @param {Function} onProgress - Callback for progress updates: (data) => void
 * @param {Function} onMatch - Callback for match events: (matchData) => void
 * @param {Function} onComplete - Callback for completion: (finalData) => void
 * @param {Function} onError - Callback for errors: (error) => void
 */
export const uploadAndProcessStream = (formData, { onProgress, onMatch, onComplete, onError }) => {
    return new Promise((resolve, reject) => {
        // First, upload the files using fetch (for better control)
        fetch(`${API_BASE_URL}/process-video`, {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            const processStream = () => {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        return;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                
                                switch (data.type) {
                                    case 'start':
                                        if (onProgress) {
                                            onProgress({ type: 'start', total_frames: data.total_frames, filename: data.filename });
                                        }
                                        break;
                                    
                                    case 'progress':
                                        if (onProgress) {
                                            onProgress({ type: 'progress', frame: data.frame, total: data.total || 0, match: false });
                                        }
                                        break;
                                    
                                    case 'match':
                                        if (onMatch) {
                                            onMatch({
                                                frame_number: data.frame,
                                                timestamp: data.timestamp,
                                                similarity: data.similarity,
                                                person: data.person
                                            });
                                        }
                                        if (onProgress) {
                                            onProgress({ type: 'progress', frame: data.frame, total: data.total || 0, match: true });
                                        }
                                        break;
                                    
                                    case 'completed':
                                        if (onComplete) {
                                            onComplete({
                                                frames_processed: data.frames_processed,
                                                matches_found: data.matches_found,
                                                report_files: data.report_files,
                                                progress: data.progress
                                            });
                                        }
                                        resolve(data);
                                        return;
                                    
                                    case 'error':
                                        const error = new Error(data.message || 'Unknown error');
                                        if (onError) {
                                            onError(error);
                                        }
                                        reject(error);
                                        return;
                                }
                            } catch (e) {
                                console.error('Error parsing SSE data:', e, line);
                            }
                        }
                    }

                    processStream(); // Continue reading
                }).catch(err => {
                    if (onError) {
                        onError(err);
                    }
                    reject(err);
                });
            };

            processStream();
        })
        .catch(err => {
            if (onError) {
                onError(err);
            }
            reject(err);
        });
    });
};

/**
 * Legacy upload and process (non-streaming, for backward compatibility)
 */
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