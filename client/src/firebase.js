import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  enableIndexedDbPersistence,  // Enables offline persistence
  onSnapshot // Used to listen for real-time updates in Firestore
} from "firebase/firestore"; // Firestore methods for user-related data
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getDatabase, get, ref } from "firebase/database"; // Realtime Database, only for draft-related features

// Firebase configuration (use your .env configuration)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL, // Realtime Database URL
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase services
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export const db = getFirestore(app); // Firestore instance for user-related data
export const rtdb = getDatabase(app); // Realtime Database for draft-related features

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

    // Ensure the user profile is saved after login
    const profileData = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    };

    // Save user profile to Firestore
    await saveUserProfile(user.uid, profileData);
    console.log('User profile saved to Firestore:', profileData); // Logging for confirmation
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
    console.log('User profile saved:', profileData); // Add logging for success
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

// Get user profile from Firestore, fallback to Realtime Database if not found
export const getUserProfile = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    console.log(`Fetching user profile for UID: ${userId} from Firestore`);

    // Fetch from Firestore
    const docSnapshot = await getDoc(userDocRef);
    if (docSnapshot.exists()) {
      console.log('User profile found in Firestore:', docSnapshot.data());
      return docSnapshot.data();
    } else {
      console.log(`No profile found in Firestore for ${userId}, trying Realtime Database.`);
      
      // Fetch from Realtime Database as fallback
      const rtdbUserRef = ref(rtdb, `users/${userId}`);
      const rtdbSnapshot = await get(rtdbUserRef);
      if (rtdbSnapshot.exists()) {
        console.log('User profile found in Realtime Database:', rtdbSnapshot.val());
        return rtdbSnapshot.val();
      } else {
        throw new Error(`No profile found in Firestore or Realtime Database for UID: ${userId}`);
      }
    }
  } catch (error) {
    console.error("Error fetching user profile from Firestore or Realtime Database:", error);
    throw error;
  }
};


// Save user team to Firestore
export const saveUserTeam = async (uid, team) => {
  try {
    await setDoc(doc(db, 'users', uid), { team }, { merge: true });
    console.log('User team saved for UID:', uid, 'Team:', team); // Add logging
  } catch (error) {
    console.error('Error saving team:', error);
    throw error;
  }
};
