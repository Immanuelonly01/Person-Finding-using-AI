// frontend/src/services/firebaseService.js
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';

// --- IMPORTANT: Replace with your actual Firebase Configuration ---
// For this environment, we use placeholders; in a real project, use your API keys.
const firebaseConfig = {
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

let userId = null; // Store user ID globally after successful auth

// --- Authentication Functions ---
export const initAuthListener = (setUser) => {
    // Listener sets the global user state upon login/logout
    onAuthStateChanged(auth, (user) => {
        if (user) {
            userId = user.uid;
            // isAuthenticated is true if the user signed up (not anonymous)
            setUser({ uid: user.uid, email: user.email, isAuthenticated: !user.isAnonymous }); 
        } else {
            // Optional: Handle redirection to login if no user is found
            setUser({ uid: null, email: null, isAuthenticated: false });
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

export const logSearchJob = async (jobData, videoFilename, reportFilenames) => {
    if (!userId) {
        throw new Error("User must be logged in to log activity.");
    }
    
    // Path: /users/{userId}/search_jobs/{docId}
    const jobsCollectionRef = collection(db, `users/${userId}/search_jobs`);
    const jobRef = doc(jobsCollectionRef);
    
    const dataToStore = {
        video_name: videoFilename,
        ...jobData, // Includes details like frames_processed, etc.
        processedAt: new Date().toISOString(),
        
        // Store report filenames for retrieval on the backend
        csv_filename: reportFilenames.csv_filename,
        pdf_filename: reportFilenames.pdf_filename,
        
        // Create a dedicated download URL unique to this job/user for the backend route
        downloadUrl: `http://localhost:5000/api/report/download_job/${userId}/${jobRef.id}`
    };

    await setDoc(jobRef, dataToStore);
    return jobRef.id;
};

// Fetches all search activity for the current user
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