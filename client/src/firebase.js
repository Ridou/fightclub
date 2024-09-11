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
    console.log("Initiating Google Login using Popup...");
    const result = await signInWithPopup(auth, provider);
    
    // User successfully signed in, get the ID token
    const idToken = await result.user.getIdToken();
    console.log("Login successful, user:", result.user);
    
    return { user: result.user, idToken };
  } catch (error) {
    console.error("Error during Google login:", error);
    throw error;
  }
};

// Function to save user profile to Firestore
export const saveUserProfile = async (userId, profileData) => {
  try {
    console.log("Saving user profile to Firestore:", profileData);
    
    // Save profile to Firestore with merge enabled
    await setDoc(doc(db, "users", userId), profileData, { merge: true });
    console.log("User profile saved successfully.");
    
    // Verify the saved document by fetching it immediately
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      console.log("User profile verified after save:", userDoc.data());
    } else {
      console.error("User profile not found after saving!");
    }
  } catch (error) {
    console.error("Error saving user profile to Firestore:", error);
  }
};

// Function to get user profile from Firestore
export const getUserProfile = async (userId) => {
  try {
    console.log(`Fetching user profile for User ID: ${userId} from Firestore...`);
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      console.log("User profile retrieved from Firestore:", userDoc.data());
      return userDoc.data();
    } else {
      console.log("No user profile found in Firestore");
      return null;
    }
  } catch (error) {
    // Handle specific Firestore error codes
    if (error.code === 'permission-denied') {
      console.error("Permission denied while accessing Firestore.");
    } else if (error.code === 'unavailable') {
      console.error("Network issue: Firestore service is currently unavailable.");
    } else {
      console.error("Error fetching user profile from Firestore:", error);
    }
    throw error;
  }
};
