import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that all required environment variables are present
const requiredEnvVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingVars);
  console.error(
    "Please check your .env file and ensure all Firebase config variables are set"
  );
}

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let googleProvider;

try {
  console.log("🔥 Initializing Firebase...");
  app = initializeApp(firebaseConfig);

  // Initialize Auth with better error handling
  auth = getAuth(app);

  // Configure Google Auth Provider
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: "select_account",
  });

  // Set persistence to LOCAL (survives browser restarts)
  // This is crucial for preventing unexpected logouts
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log(
        "✅ Firebase Auth persistence set to LOCAL (survives browser restarts)"
      );
    })
    .catch((error) => {
      console.error("❌ Failed to set Auth persistence:", error);
    });

  // Initialize Firestore
  db = getFirestore(app);

  // Initialize Storage
  storage = getStorage(app);

  console.log("✅ Firebase initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);

  // Create mock objects to prevent crashes
  auth = null;
  db = null;
  storage = null;
  googleProvider = null;
}

// Add auth state persistence check
if (auth) {
  // Listen for auth state changes once during initialization
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("🔐 User restored from persistence:", user.uid);
    } else {
      console.log("🔓 No user in persistence");
    }
  });
}

export { auth, db, storage, googleProvider };
export default firebaseConfig;
