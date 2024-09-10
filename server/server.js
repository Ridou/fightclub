const express = require('express');
const { admin, db } = require('./firebase-admin'); // Firebase Admin setup
const app = express();

app.use(express.json());

// Route to handle Google login (verifies token from the client)
app.post('/api/login', async (req, res) => {
  try {
    const { idToken } = req.body; // Expect the client to send the Google ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Optionally, save or update the user's information in Firestore
    const userRef = db.collection('users').doc(uid);
    await userRef.set({
      email: decodedToken.email,
      displayName: decodedToken.name,
    }, { merge: true });

    res.status(200).json({ uid, message: "Login successful" });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Route to handle logout (if needed for tracking, but usually client-side)
app.post('/api/logout', (req, res) => {
  // This could be used to track logout events on the server if needed
  res.status(200).json({ message: 'Logged out successfully' });
});

// Route to fetch game user info from Firestore
app.get('/api/user/:uid', async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.params.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(userDoc.data());
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Route to update user profile in Firestore
app.put('/api/user/:uid', async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.params.uid);
    await userRef.update(req.body); // Update user with provided data (e.g., roleId, game data)
    res.status(200).json({ message: 'User profile updated' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Route to fetch ladder data
app.get('/api/ladder', async (req, res) => {
  try {
    const ladderRef = db.collection('ladder');
    const snapshot = await ladderRef.get();
    const ladder = snapshot.docs.map(doc => doc.data());
    res.status(200).json(ladder);
  } catch (error) {
    console.error('Error fetching ladder data:', error);
    res.status(500).json({ error: 'Failed to fetch ladder data' });
  }
});

// Route to add player to the ladder
app.post('/api/ladder', async (req, res) => {
  try {
    const player = req.body; // Player data is expected in the request body
    await db.collection('ladder').add(player);
    res.status(201).json({ message: 'Player added to ladder' });
  } catch (error) {
    console.error('Error adding player to ladder:', error);
    res.status(500).json({ error: 'Failed to add player' });
  }
});

// Route to add character to Firestore
app.post('/api/characters', async (req, res) => {
  try {
    const character = req.body; // Character data expected in request body
    await db.collection('characters').add(character);
    res.status(201).json({ message: `Character ${character.name} added to Firestore` });
  } catch (error) {
    console.error('Error adding character to Firestore:', error);
    res.status(500).json({ error: 'Failed to add character' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
