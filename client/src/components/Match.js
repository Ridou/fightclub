import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, set, onValue, remove } from 'firebase/database';

const Match = ({ user, handleQueueUpdate }) => {
  const navigate = useNavigate();
  const [queueCount, setQueueCount] = useState(0);
  const [waiting, setWaiting] = useState(true);
  const [matchedPlayer, setMatchedPlayer] = useState(null);
  const db = getDatabase(); // Initialize Firebase Realtime Database

  // Function to add user to the global queue
  const joinQueue = () => {
    const userQueueRef = ref(db, `queue/${user.uid}`);
    set(userQueueRef, {
      uid: user.uid,
      inGameName: user.displayName || 'Player',
    });
  };

  // Function to match with another player from the queue
  const matchPlayer = () => {
    const queueRef = ref(db, 'queue/');
    onValue(queueRef, (snapshot) => {
      const queueData = snapshot.val();

      // Look for another player in the queue
      if (queueData) {
        const playerIds = Object.keys(queueData);
        const otherPlayerId = playerIds.find((id) => id !== user.uid);

        if (otherPlayerId) {
          const otherPlayer = queueData[otherPlayerId];
          setMatchedPlayer(otherPlayer);

          // Remove both players from the queue
          remove(ref(db, `queue/${user.uid}`));
          remove(ref(db, `queue/${otherPlayerId}`));

          setWaiting(false); // Stop waiting once a match is found
        }
      }
    });
  };

  // Effect to add user to queue and start searching for a match
  useEffect(() => {
    if (user) {
      joinQueue();
      matchPlayer();
    }
  }, [user]);

  // Create the draft room once a match is found
  useEffect(() => {
    if (matchedPlayer && user) {
      const draftRoomId = `draft-${user.uid}-${matchedPlayer.uid}`;
      const draftRoomRef = ref(db, `draftRooms/${draftRoomId}`);

      set(draftRoomRef, {
        player1: {
          uid: user.uid,
          inGameName: user.displayName || user.inGameName || 'Player 1',
        },
        player2: {
          uid: matchedPlayer.uid,
          inGameName: matchedPlayer.inGameName || 'Player 2',
        },
        currentTurn: 1, // Player 1 starts
        bannedCharacters: { player1: null, player2: null },
        player1Picks: [],
        player2Picks: [],
      })
        .then(() => {
          // Navigate to draft page with both player IDs and in-game names
          navigate('/draft', {
            state: {
              draftRoomId,
              player1: {
                uid: user.uid,
                inGameName: user.displayName || user.inGameName || 'Player 1',
              },
              player2: {
                uid: matchedPlayer.uid,
                inGameName: matchedPlayer.inGameName || 'Player 2',
              },
            },
          });
        })
        .catch((error) => {
          console.error("Error creating draft room in Firebase:", error);
        });
    }
  }, [matchedPlayer, user, navigate]);

  if (!user) {
    return <p>Loading user information...</p>;
  }

  return (
    <div className="match">
      <h2>Match Started</h2>
      <p>Players in queue: {queueCount}</p>
      {waiting && <p>Waiting for an opponent...</p>}
    </div>
  );
};

export default Match;
