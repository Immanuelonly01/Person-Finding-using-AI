// frontend/src/services/firebaseService.js (FINALIZED & CLEANED)

import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, getDocs, orderBy, getDoc } from 'firebase/firestore'; 

// --- CRITICAL FIX: USING YOUR ACTUAL PROJECT CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDiyK_WlKaTQJ4h7WkuGiUnF850rzprp8Y",
  authDomain: "person-search-using-ai-c5e6b.firebaseapp.com",
  projectId: "person-search-using-ai-c5e6b",
  storageBucket: "person-search-using-ai-c5e6b.firebasestorage.app",
  messagingSenderId: "735068010061",
  appId: "1:735068010061:web:4ea47448b6856c66dbce04"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let userId = null; // Global variable to hold the current user's UID

// --- Authentication Functions ---

/**
 * Initializes the Firebase Auth Listener.
 * It fetches the user's name (if available) after authentication status changes.
 */
export const initAuthListener = (setUserCallback) => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            const isAuthenticated = !user.isAnonymous;
            
            // Fetch profile data (name) if available
            const profile = await fetchUserProfile(user.uid); 

            setUserCallback({ 
                uid: user.uid, 
                email: user.email || 'Guest User',
                isAuthenticated: isAuthenticated,
                // Store first name for display purposes, defaulting if profile doesn't exist
                name: profile ? profile.firstName : (isAuthenticated && user.email ? user.email.split('@')[0] : 'Guest') 
            }); 
            
        } else {
            // User is signed out. Set global state to unauthenticated/guest.
            // We rely on the Login page to initiate sign-in if needed.
            userId = null;
            setUserCallback({ uid: null, email: null, name: 'Guest', isAuthenticated: false });
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

// --- Firestore Data Functions (User Profile) ---

/**
 * Stores First Name and Last Name in a dedicated 'users' collection after registration.
 */
export const saveUserName = async (uid, firstName, lastName) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`,
        createdAt: new Date().toISOString(),
    }, { merge: true });
};

/**
 * Fetches user profile data (like name) from Firestore.
 */
export const fetchUserProfile = async (uid) => {
    if (!uid) return null;
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
};


// --- Firestore Data Functions (Job Logging) ---

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
    const jobsCollectionRef = collection(db, `users/${userId}/search_jobs`);
    const q = query(jobsCollectionRef, orderBy('processedAt', 'desc'));
    
    const snapshot = await getDocs(q);
    
    const activity = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));
    
    return activity;
};