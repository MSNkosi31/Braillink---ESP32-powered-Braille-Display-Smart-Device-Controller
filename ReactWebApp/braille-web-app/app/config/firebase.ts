import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration
// Replace these values with your actual Firebase project configuration
// Get these values from Firebase Console > Project Settings > Your apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCCO-GBVHY8uvXEVbZIZCTzaIj0-1xLzfM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "braille-display-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "braille-display-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "braille-display-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "680348974640",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:680348974640:web:258ef2e5cda7a2cc98f7f5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Connect to Firebase emulators in development
if (import.meta.env.DEV) {
  // Uncomment these lines if you want to use Firebase emulators for development
  // connectAuthEmulator(auth, "http://localhost:9099");
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

export default app;
