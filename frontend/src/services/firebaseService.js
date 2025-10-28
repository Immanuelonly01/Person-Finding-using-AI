// frontend/src/services/firebaseService.js

import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';

// --- IMPORTANT: Replace with your actual Firebase Configuration ---
const firebaseConfig = {
    // Note: You MUST update these placeholders with your project's actual keys for this to work.
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let userId = null; // Global variable to hold the current user's UID

// --- Authentication Functions ---

/**
 * Initializes the Firebase Auth Listener and attempts anonymous sign-in if no user is found.
 * This is crucial for maintaining session state.
 */
export const initAuthListener = (setUser) => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            userId = user.uid;
            // isAuthenticated is true ONLY if the user signed up with email/password (not anonymous)
            const isAuthenticated = !user.isAnonymous;

            setUser({ 
                uid: user.uid, 
                email: user.email || 'Guest User', // Use 'Guest User' if email is null
                isAuthenticated: isAuthenticated
            }); 
            
        } else {
            // If no user is found (e.g., after initial load or logout), sign in anonymously 
            // to enable Firestore read/write access for guests/unlogged users (if configured).
            signInAnonymously(auth).catch((error) => {
                console.error("Anonymous sign-in failed:", error);
                setUser({ uid: null, email: null, isAuthenticated: false });
            });
            userId = null;
        }
    });
};

export const registerUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = () => {
    return signOut(auth);
};

// --- Firestore Data Functions ---

/**
 * Logs a successful batch search job to the user's Firestore collection.
 */
export const logSearchJob = async (jobData, videoFilename, reportFilenames) => {
    if (!userId) {
        throw new Error("User must be authenticated to log activity.");
    }
    
    // Path: /users/{userId}/search_jobs/{docId}
    const jobsCollectionRef = collection(db, `users/${userId}/search_jobs`);
    const jobRef = doc(jobsCollectionRef);
    
    const dataToStore = {
        video_name: videoFilename,
        ...jobData, 
        processedAt: new Date().toISOString(),
        
        // Store report filenames 
        csv_filename: reportFilenames.csv_filename,
        pdf_filename: reportFilenames.pdf_filename,
        
        // Create a dedicated download URL for the backend route
        downloadUrl: `http://localhost:5000/api/report/download_job/${userId}/${jobRef.id}`
    };

    await setDoc(jobRef, dataToStore);
    return jobRef.id;
};

/**
 * Fetches all search activity for the current user, ordered by date.
 */
export const fetchUserActivity = async () => {
    if (!userId) {
        return [];
    }
    // Path: /users/{userId}/search_jobs/
    const jobsCollectionRef = collection(db, `users/${userId}/search_jobs`);
    const q = query(jobsCollectionRef, orderBy('processedAt', 'desc'));
    
    const snapshot = await getDocs(q);
    
    const activity = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));
    
    return activity;
};