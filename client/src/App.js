import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Ladder from './components/Ladder';
import AccountDetails from './components/AccountDetails';
import Draft from './components/Draft';
import CharacterList from './components/CharacterList';
import Header from './components/Header';
import Match from './components/Match'; // Importing the Match component
import { loginWithGoogle } from './firebase';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null); // Store user account info
  const [inGameName, setInGameName] = useState(''); // Store the in-game name
  const [loading, setLoading] = useState(true);

  const db = getFirestore(); // Firestore reference

  // Fetch the in-game name from Firestore
  const fetchInGameName = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid)); // Assuming you store the user data under 'users' collection
      if (userDoc.exists()) {
        setInGameName(userDoc.data().inGameName);
      }
    } catch (error) {
      console.error('Error fetching in-game name:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await auth.signOut();
      setUser(null);
      setInGameName(''); // Clear the in-game name
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Handle Google Login
  const handleLogin = async () => {
    try {
      setLoading(true);
      const { user } = await loginWithGoogle();
      setUser(user);
      fetchInGameName(user.uid); // Fetch the in-game name after login
    } catch (error) {
      console.error("Error during login:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchInGameName(currentUser.uid); // Fetch in-game name on reload
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="App">
      <Header user={user} inGameName={inGameName} handleLogout={handleLogout} />

      {!user ? (
        <>
          <h1>Fight Club</h1>
          <button onClick={handleLogin}>Login with Gmail</button>
          <Routes>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </>
      ) : (
        <>
          <Routes>
            <Route path="/account" element={<AccountDetails user={user} />} />
            <Route path="/characters" element={<CharacterList />} />
            <Route path="/draft" element={<Draft />} />
            <Route path="/ladder" element={<Ladder />} />
            <Route path="/match" element={<Match />} /> {/* Adding match route */}
            <Route path="/" element={<Navigate to="/account" />} />
            <Route path="*" element={<Navigate to="/account" />} />
          </Routes>
        </>
      )}
    </div>
  );
}

export default App;
