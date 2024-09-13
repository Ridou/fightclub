const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const db = admin.firestore(); // Assuming firebase-admin is initialized elsewhere

// Route to save user team
router.post('/saveTeam', async (req, res) => {
  const { userId, team } = req.body;
  try {
    await db.collection('userTeams').doc(userId).set({ team });
    res.status(200).send('Team saved successfully');
  } catch (error) {
    console.error('Error saving team:', error);
    res.status(500).send('Error saving team');
  }
});

// Route to get user team
router.get('/getTeam/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const teamDoc = await db.collection('userTeams').doc(userId).get();
    if (teamDoc.exists) {
      res.status(200).json(teamDoc.data());
    } else {
      res.status(404).send('No team found');
    }
  } catch (error) {
    console.error('Error retrieving team:', error);
    res.status(500).send('Error retrieving team');
  }
});

module.exports = router;
