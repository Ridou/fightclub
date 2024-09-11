// /routes/authRoutes.js
const express = require('express');
const admin = require('../config/firebaseAdmin');
const router = express.Router();

// Route to handle login verification (for client-side POST requests)
router.post('/login', async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    res.status(200).json({ uid, message: 'Login successful' });
  } catch (error) {
    console.error('Error verifying ID token:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
