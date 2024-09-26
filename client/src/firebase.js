import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  persistentLocalCache,  // New caching method for Firestore
  onSnapshot 
} from "firebase/firestore"; // Firestore methods for user-related data
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getDatabase, get, ref } from "firebase/database"; // Realtime Database for draft-related features

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
export const db = initializeFirestore(app, {
  cache: persistentLocalCache(), // Use new Firestore cache method
}); 
export const rtdb = getDatabase(app); // Realtime Database for draft-related features

// Enable Firestore offline persistence to reduce read quota
// This function has been replaced by persistentLocalCache() in the initialization above, no need to call it here again.

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

    // Cache the profile locally
    localStorage.setItem(`profile_${userId}`, JSON.stringify(profileData));
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

// Get user profile from Firestore, fallback to Realtime Database if not found
export const getUserProfile = async (userId) => {
  try {
    // First, check localStorage for cached profile
    const cachedProfile = localStorage.getItem(`profile_${userId}`);
    if (cachedProfile) {
      console.log(`Using cached profile for UID: ${userId}`);
      return JSON.parse(cachedProfile);
    }

    // Fetch from Firestore
    const userDocRef = doc(db, "users", userId);
    console.log(`Fetching user profile for UID: ${userId} from Firestore`);

    const docSnapshot = await getDoc(userDocRef);
    if (docSnapshot.exists()) {
      const profileData = docSnapshot.data();
      console.log('User profile found in Firestore:', profileData);

      // Cache the profile locally
      localStorage.setItem(`profile_${userId}`, JSON.stringify(profileData));
      return profileData;
    } else {
      console.log(`No profile found in Firestore for ${userId}, trying Realtime Database.`);

      // Fetch from Realtime Database as fallback
      const rtdbUserRef = ref(rtdb, `users/${userId}`);
      const rtdbSnapshot = await get(rtdbUserRef);
      if (rtdbSnapshot.exists()) {
        const profileData = rtdbSnapshot.val();
        console.log('User profile found in Realtime Database:', profileData);

        // Cache the profile locally
        localStorage.setItem(`profile_${userId}`, JSON.stringify(profileData));
        return profileData;
      } else {
        throw new Error(`No profile found in Firestore or Realtime Database for UID: ${userId}`);
      }
    }
  } catch (error) {
    console.error("Error fetching user profile from Firestore or Realtime Database:", error);
    throw error;
  }
};

// Fetch all available characters from Firestore
export const fetchCharacters = async () => {
  try {
    const charactersCollection = collection(db, 'characters'); // Make sure you have a 'characters' collection
    const snapshot = await getDocs(charactersCollection);
    const characters = snapshot.docs.map((doc) => doc.data());
    return characters;
  } catch (error) {
    console.error("Error fetching characters:", error);
    throw error;
  }
};

// Save user team to Firestore
export const saveUserTeam = async (uid, team) => {
  try {
    await setDoc(doc(db, 'users', uid), { team }, { merge: true });
    console.log('User team saved for UID:', uid, 'Team:', team);

    // Cache the team locally
    localStorage.setItem(`team_${uid}`, JSON.stringify(team));
  } catch (error) {
    console.error('Error saving team:', error);
    throw error;
  }
};

// Get user team (cached locally if available)
export const getUserTeam = async (uid) => {
  try {
    // First, check localStorage for cached team
    const cachedTeam = localStorage.getItem(`team_${uid}`);
    if (cachedTeam) {
      console.log(`Using cached team for UID: ${uid}`);
      return JSON.parse(cachedTeam);
    }

    // Fetch from Firestore
    const userDocRef = doc(db, 'users', uid);
    console.log(`Fetching team for UID: ${uid} from Firestore`);

    const docSnapshot = await getDoc(userDocRef);
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      if (data.team) {
        console.log('User team found in Firestore:', data.team);

        // Cache the team locally
        localStorage.setItem(`team_${uid}`, JSON.stringify(data.team));
        return data.team;
      } else {
        console.log('No team found for this user in Firestore');
        return null;
      }
    } else {
      throw new Error('No user team found in Firestore');
    }
  } catch (error) {
    console.error("Error fetching user team:", error);
    throw error;
  }
};
