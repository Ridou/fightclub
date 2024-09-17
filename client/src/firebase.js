import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  enableIndexedDbPersistence,  // Enables offline persistence
  onSnapshot // Used to listen for real-time updates
} from "firebase/firestore"; // Firestore methods
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

// Enable Firestore offline persistence to reduce read quota
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.log('The current browser does not support offline persistence.');
    }
  });

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

// Get user profile from Firestore with caching
export const getUserProfile = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);

    // Use Firestore's snapshot listener to get the cached data first, then update with server data if available
    return new Promise((resolve, reject) => {
      onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          resolve(data); // Return cached or updated data
        } else {
          reject('No user profile found');
        }
      }, (error) => {
        console.error("Error fetching user profile from Firestore:", error);
        reject(error);
      });
    });
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
