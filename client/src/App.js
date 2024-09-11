import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Ladder from './components/Ladder';
import AccountDetails from './components/AccountDetails';
import { loginWithGoogle } from './firebase'; // Import loginWithGoogle for login functionality
import { getAuth } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null); // Store user account info
  const [gameData, setGameData] = useState(null); // Store in-game data
  const [loading, setLoading] = useState(true);

  // Handle logout (client-side)
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await auth.signOut(); // Firebase client-side sign out
      setUser(null); // Clear user info
      setGameData(null); // Clear game data
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Handle Google Login
  const handleLogin = async () => {
    try {
      setLoading(true);
      const { user } = await loginWithGoogle(); // Login using popup
      setUser(user); // Set the user data in state
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
        setUser(currentUser); // Set the cached user on reload
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="App">
      <h1>Fight Club</h1>
      {!user ? (
        <>
          <button onClick={handleLogin}>Login with Gmail</button>
        </>
      ) : (
        <>
          <button onClick={handleLogout}>Logout</button>
          <h2>Welcome, {user.email}</h2>
          <Routes>
            <Route
              path="/"
              element={
                <AccountDetails
                  user={user}
                  gameData={gameData}
                  setGameData={setGameData}
                />
              }
            />
            {gameData && <Route path="/ladder" element={<Ladder gameData={gameData} />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </>
      )}
    </div>
  );
}

export default App;
