const admin = require("firebase-admin");
require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// Get Firestore database instance
const db = admin.firestore();

// Function to add character data to Firestore
const addCharacterToFirestore = async (character) => {
  try {
    const characterRef = db.collection('characters');
    await characterRef.add(character);
    console.log(`Character ${character.name} added to Firestore`);
  } catch (error) {
    console.error('Error adding character to Firestore:', error);
  }
};

// Function to fetch ladder data
const fetchLadder = async () => {
  try {
    const ladderRef = db.collection('ladder');
    const snapshot = await ladderRef.get();
    const ladderList = snapshot.docs.map(doc => doc.data());
    return ladderList;
  } catch (error) {
    console.error('Error fetching ladder:', error);
    throw error;
  }
};

// Function to add player to the ladder
const addPlayerToLadder = async (player) => {
  try {
    const ladderRef = db.collection('ladder');
    await ladderRef.add(player);
    console.log('Player added to ladder');
  } catch (error) {
    console.error('Error adding player to ladder:', error);
    throw error;
  }
};

module.exports = {
  addCharacterToFirestore,
  fetchLadder,
  addPlayerToLadder,
};
