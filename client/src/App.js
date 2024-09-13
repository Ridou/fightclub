import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Ladder from './components/Ladder';
import Draft from './components/Draft';
import CharacterList from './components/CharacterList';
import Header from './components/Header';
import Match from './components/Match';
import AccountPage from './pages/AccountPage'; // Import AccountPage
import { loginWithGoogle } from './firebase';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null); // Store user account info
  const [inGameName, setInGameName] = useState(''); // Store the in-game name
  const [team, setTeam] = useState([]); // Store the user's team
  const [loading, setLoading] = useState(true);

  const db = getFirestore(); // Firestore reference

  // Fetch the user details (in-game name and team) from Firestore
  const fetchUserDetails = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid)); // Assuming you store the user data under 'users' collection
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setInGameName(userData.inGameName);
        setTeam(userData.team || []); // Fetch the team or default to an empty array
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await auth.signOut();
      setUser(null);
      setInGameName(''); // Clear the in-game name
      setTeam([]); // Clear the team
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
      fetchUserDetails(user.uid); // Fetch user details after login
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
        fetchUserDetails(currentUser.uid); // Fetch user details on reload
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="App">
      <Header user={user} inGameName={inGameName} team={team} handleLogout={handleLogout} /> {/* Pass team and inGameName */}

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
            <Route path="/account" element={<AccountPage user={user} />} /> {/* Updated to use AccountPage */}
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
