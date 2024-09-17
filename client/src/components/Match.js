import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid'; // For generating unique draft room IDs

const Match = ({ user }) => {
  const navigate = useNavigate();
  const [matchedPlayer, setMatchedPlayer] = useState(null);
  const [draftRoomId, setDraftRoomId] = useState(null); // Track draft room ID

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

          // Create a unique draft room ID for each match
          const roomId = uuidv4();
          setDraftRoomId(roomId);

          // Assign player roles based on UID
          const player1 = user.uid < opponent.uid ? { uid: user.uid, inGameName: user.displayName || 'Player 1' } : { uid: opponent.uid, inGameName: opponent.inGameName || 'Player 1' };
          const player2 = user.uid > opponent.uid ? { uid: user.uid, inGameName: user.displayName || 'Player 2' } : { uid: opponent.uid, inGameName: opponent.inGameName || 'Player 2' };

          // Remove both players from the queue once matched
          deleteDoc(doc(db, `queue/${user.uid}`));
          deleteDoc(doc(db, `queue/${opponent.uid}`));
          console.log(`Both players (${user.uid} and ${opponent.uid}) removed from the queue.`);

          // Navigate to the draft with player1 and player2 assigned
          navigate('/draft', {
            state: {
              player1,
              player2,
              draftRoomId: roomId, // Pass the unique room ID to Draft
            },
          });
        }
      } else {
        console.log('Not enough players in the queue.');
      }
    });

    return () => {
      unsubscribe(); // Unsubscribe from real-time updates when component unmounts
    };
  }, [user]);

  return (
    <div>
      <h2>Waiting for an opponent...</h2>
    </div>
  );
};

export default Match;
