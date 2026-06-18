import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let firebaseConfig = {
  apiKey: "AIzaSyByF7zb9jen-WXE0nDUIcKCG2Pe9oHv8No",
  authDomain: "gen-lang-client-0971332173.firebaseapp.com",
  projectId: "gen-lang-client-0971332173",
  storageBucket: "gen-lang-client-0971332173.firebasestorage.app",
  messagingSenderId: "639783139725",
  appId: "1:639783139725:web:7184208332c3d47a5da5c4"
};

// Initialize app securely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export { GoogleAuthProvider, signInWithPopup, signOut };
