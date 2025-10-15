import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration
// Replace these values with your actual Firebase project configuration
// Get these values from Firebase Console > Project Settings > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyDzQFuSx27OASupNRRl-Ncq7kA7shv52Pk",

  authDomain: "braillink-56926.firebaseapp.com",

  projectId: "braillink-56926",

  storageBucket: "braillink-56926.firebasestorage.app",

  messagingSenderId: "498186932089",

  appId: "1:498186932089:web:ee2efbf0ee9e2462daa9a8",

  measurementId: "G-NQTB10HN1F" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Connect to Firebase emulators in development
//if (import.meta.env.DEV) {
  // Uncomment these lines if you want to use Firebase emulators for development
  // connectAuthEmulator(auth, "http://localhost:9099");
  // connectFirestoreEmulator(db, 'localhost', 8080);
//}

export default app;
