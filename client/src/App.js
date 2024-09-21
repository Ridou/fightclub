import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client'; // Import socket.io client
import Ladder from './components/Ladder';
import Draft from './components/Draft';
import CharacterList from './components/CharacterList';
import Header from './components/Header';
import Match from './components/Match';
import AccountPage from './pages/AccountPage'; // Import AccountPage
import { loginWithGoogle, getUserProfile } from './firebase'; // Import getUserProfile
import { getAuth } from "firebase/auth";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import QueryClient and Provider

// Create a query client instance
const queryClient = new QueryClient();

function App() {
  const [user, setUser] = useState(null); // Store user account info
  const [inGameName, setInGameName] = useState(''); // Store the in-game name
  const [team, setTeam] = useState([]); // Store the user's team
  const [queueCount, setQueueCount] = useState(0); // Store queue count
  const [loading, setLoading] = useState(true); // Loading state
  const [socket, setSocket] = useState(null); // Store WebSocket connection

// Fetch the user details (in-game name and team) from Firestore with caching
const fetchUserDetails = async (uid) => {
  try {
    console.log(`Fetching user details for UID: ${uid}`);
    const userData = await getUserProfile(uid); // Use the updated function that checks both Firestore and Realtime Database
    if (userData) {
      setInGameName(userData.displayName || "Unknown User");
      setTeam(userData.team || []); // Fetch the team or default to an empty array
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
  }
};

useEffect(() => {
  if (user) {
    console.log('User logged in, fetching details:', user.uid);
    fetchUserDetails(user.uid); // Fetch details whenever the user is updated or logged in
  }
}, [user]);

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
    console.log('Logged in as:', user); // Add logging
    setUser(user);
    fetchUserDetails(user.uid); // Fetch user details after login
  } catch (error) {
    console.error("Error during login:", error);
  } finally {
    setLoading(false);
  }
};


  // WebSocket connection initialization
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'], // Force WebSocket transport to avoid polling
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('updateDraft', (data) => {
      console.log('Draft update received:', data);
    });

    // Cleanup the socket connection on unmount
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  // onAuthStateChanged listener with additional logging
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        console.log('Current user after reload:', currentUser); // Add logging
        setUser(currentUser);
        fetchUserDetails(currentUser.uid); // Fetch user details on reload
      } else {
        console.log('No user is logged in'); // Add logging
      }
      setLoading(false);
    });

    return () => unsubscribe();
}, []);

  // Function to update queue count (could be part of Match component too)
  const handleQueueUpdate = (newCount) => {
    setQueueCount(newCount);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <QueryClientProvider client={queryClient}> {/* Wrap your app with QueryClientProvider */}
      <div className="App">
        <Header 
          user={user} 
          inGameName={inGameName} 
          team={team} 
          handleLogout={handleLogout} 
          queueCount={queueCount}  // Pass queue count to Header if needed
        />

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
              <Route path="/draft" element={<Draft user={user} socket={socket} />} /> {/* Pass the socket to Draft */}
              <Route 
                path="/match" 
                element={<Match user={user} handleQueueUpdate={handleQueueUpdate} />} // Pass user and queue update
              /> 
              <Route path="/ladder" element={<Ladder />} />
              <Route path="/" element={<Navigate to="/account" />} />
              <Route path="*" element={<Navigate to="/account" />} />
            </Routes>
          </>
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;
