import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure you import Firestore instance

const Match = ({ user }) => {
  const navigate = useNavigate();
  const [matchedPlayer, setMatchedPlayer] = useState(null);

  // Function to add the user to the queue in Firestore
  const joinQueue = async () => {
    try {
      console.log(`Attempting to add ${user.displayName || 'Player'} (${user.uid}) to the queue.`);
      const queueRef = doc(db, `queue/${user.uid}`);
      await setDoc(queueRef, { uid: user.uid, inGameName: user.displayName || 'Player' });
      console.log(`${user.displayName || 'Player'} successfully added to the queue.`);
    } catch (error) {
      console.error('Error adding player to the queue:', error);
    }
  };

  // Listen to the queue in real-time for updates
  useEffect(() => {
    console.log(`User ${user.displayName || 'Player'} (${user.uid}) joined the queue.`);

    joinQueue();

    const queueRef = collection(db, 'queue');
    const unsubscribe = onSnapshot(queueRef, (snapshot) => {
      const queueData = snapshot.docs.map((doc) => doc.data());
      console.log('Real-time queue data:', queueData);

      if (queueData.length > 1) {
        const opponent = queueData.find((player) => player.uid !== user.uid);
        if (opponent) {
          console.log(`Match found: ${opponent.inGameName || 'Player'} (${opponent.uid})`);
          setMatchedPlayer(opponent);

          // Remove both players from the queue once matched
          deleteDoc(doc(db, `queue/${user.uid}`));
          deleteDoc(doc(db, `queue/${opponent.uid}`));
          console.log(`Both players (${user.uid} and ${opponent.uid}) removed from the queue.`);
        }
      } else {
        console.log('Not enough players in the queue.');
      }
    });

    return () => {
      unsubscribe(); // Unsubscribe from real-time updates when component unmounts
    };
  }, [user]);

  // Navigate to the draft once a match is found
  useEffect(() => {
    if (matchedPlayer) {
      console.log(`Navigating to draft with ${matchedPlayer.inGameName || 'Player'} (${matchedPlayer.uid})...`);
      const serializableUser = {
        uid: user.uid,
        inGameName: user.displayName || 'Player 1',
      };
      const serializableOpponent = {
        uid: matchedPlayer.uid,
        inGameName: matchedPlayer.inGameName || 'Player 2',
      };

      navigate('/draft', {
        state: {
          player1: serializableUser,
          player2: serializableOpponent,
        },
      });
    }
  }, [matchedPlayer, user, navigate]);

  return (
    <div>
      <h2>Waiting for an opponent...</h2>
    </div>
  );
};

export default Match;
