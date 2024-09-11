// /routes/googleRoutes.js
const express = require('express');
const { google } = require('googleapis');
const admin = require('../config/firebaseAdmin');
require('dotenv').config();
const router = express.Router();

// Set up the Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/google/callback'  // The redirect URI that Google will call back to
);

// Generate the Google login URL and return it to the client
router.get('/login', (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  // Respond with the Google OAuth login URL
  res.status(200).json({ url });
});

// Google OAuth callback route
router.get('/google/callback', async (req, res) => {
  const code = req.query.code;

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    const userInfo = await oauth2.userinfo.get();
    const idToken = tokens.id_token; // This is the ID token we want to verify with Firebase

    console.log("User info:", userInfo.data);

    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Decoded token:", decodedToken);

    // Optionally save user info to your database here
    const uid = decodedToken.uid;

    // Redirect to frontend with the user info
    res.redirect(`http://localhost:3000?email=${userInfo.data.email}&uid=${uid}`);
  } catch (error) {
    console.error('Error during Google login:', error);
    res.status(500).send('Authentication failed');
  }
});

module.exports = router;
