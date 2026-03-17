
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

// Import the Firebase configuration from the applet config file if it exists
import firebaseConfigData from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey || process.env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseConfigData.authDomain || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfigData.projectId || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfigData.storageBucket || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfigData.messagingSenderId || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfigData.appId || process.env.VITE_FIREBASE_APP_ID,
  measurementId: firebaseConfigData.measurementId || process.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

try {
    // Robust check: ensure apiKey exists
    const isValidConfig = firebaseConfig.apiKey && 
                         firebaseConfig.apiKey !== "PLACEHOLDER_API_KEY" &&
                         !firebaseConfig.apiKey.includes("undefined");

    if (isValidConfig) {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        
        // Use the named database if provided in the config
        const databaseId = (firebaseConfigData as any).firestoreDatabaseId || '(default)';
        db = getFirestore(app, databaseId);
        
        storage = getStorage(app);
        
        isSupported().then(yes => {
            if (yes) analytics = getAnalytics(app);
        });
    } else {
        console.warn("Firebase configuration is missing or invalid.");
    }
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

// Export services (they might be undefined if init failed, but app handles this)
export { auth, db, storage, analytics };
export default firebaseConfig;
