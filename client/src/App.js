import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Ladder from './components/Ladder';
import AccountDetails from './components/AccountDetails'; // New component for account details
import { loginWithGoogle } from './firebase'; // Only import loginWithGoogle
import { getAuth } from "firebase/auth"; // For logout

function App() {
  const [user, setUser] = useState(null); // Store user account info
  const [gameData, setGameData] = useState(null); // Store in-game data
  const [loading, setLoading] = useState(true);

  // Handle login
  const handleLogin = async () => {
    try {
      const loggedInUser = await loginWithGoogle(); // Google login
      setUser(loggedInUser); // Store user info
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

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

  useEffect(() => {
    setLoading(false); // Simulate loading done
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
