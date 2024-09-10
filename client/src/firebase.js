import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Handle Google login
export const loginWithGoogle = async () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken(); // Get ID token to send to the server

    // Send the ID token to the server for verification and further handling
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) throw new Error('Login failed on the server.');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error during Google login:", error);
    throw error;
  }
};
