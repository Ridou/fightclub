const admin = require("firebase-admin");
require("dotenv").config(); // To load environment variables from .env

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore(); // Firestore instance

module.exports = { admin, db };
