import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"; // Firestore methods
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Firebase configuration (use your .env configuration)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export const db = getFirestore(app); // Initialize Firestore

// Google login function using popup
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return { user };
  } catch (error) {
    console.error("Error during Google login:", error);
    throw error;
  }
};

// Save user profile to Firestore
export const saveUserProfile = async (userId, profileData) => {
  try {
    await setDoc(doc(db, "users", userId), profileData, { merge: true });
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

// Get user profile from Firestore
export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile from Firestore:", error);
    throw error;
  }
};

// Save user team to Firestore
export const saveUserTeam = async (uid, team) => {
  try {
    await setDoc(doc(db, 'users', uid), { team }, { merge: true });
  } catch (error) {
    console.error('Error saving team:', error);
    throw error;
  }
};
