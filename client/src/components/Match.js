import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, deleteDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { db, rtdb } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import useDraftRoom from '../hooks/useDraftRoom';

const Match = ({ user }) => {
  const navigate = useNavigate();
  const [matchedPlayer, setMatchedPlayer] = useState(null);
  const [draftRoomId, setDraftRoomId] = useState(null);

  const { createOrUpdateDraftRoom } = useDraftRoom(); // Call the hook inside the component

  // Placeholder data for initializing the draft room
  const placeholderData = {
    player1Deployed: ["Placeholder1"],
    player2Deployed: ["Placeholder2"],
    bannedCharacters: {
      player1: ["Placeholder1"],
      player2: ["Placeholder2"]
    }
  };

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

  // Function to create the draft room in Firebase Realtime Database with initialized data
  const createDraftRoom = async (roomId, playerA, playerB) => {
    const draftRoomRef = ref(rtdb, `draftRooms/${roomId}`);

    // Randomly assign Player 1 and Player 2
    const isPlayer1 = Math.random() < 0.5;
    const player1 = isPlayer1 ? playerA : playerB;
    const player2 = isPlayer1 ? playerB : playerA;

    console.log('Creating draft room with initialized data:');
    console.log('Player 1:', player1);
    console.log('Player 2:', player2);

    // Initialize player data and room settings
    const initializedData = {
      player1: {
        name: player1.inGameName || 'Player 1',
        uid: player1.uid
      },
      player2: {
        name: player2.inGameName || 'Player 2',
        uid: player2.uid
      },
      player1Deployed: [""], // Initialize with empty array
      player2Deployed: [""],
      bannedCharacters: {
        player1: [""],
        player2: [""]
      },
      turn: 1, // Start with Player 1's turn
      banPhase: true, // Begin with Ban Phase
      timer: 60
    };

    try {
      console.log(`Creating draft room with ID: ${roomId} and initialized data`);
      await set(draftRoomRef, initializedData); // Store initialized data in Firebase
      console.log(`Draft room ${roomId} created successfully in Firebase.`);
    } catch (error) {
      console.error('Error creating draft room in Firebase:', error);
    }
  };

  // Function to handle matchmaking and creating/joining a draft room
  const handleMatchmaking = async () => {
    const queueSnapshot = await getDocs(collection(db, 'queue'));
    const queueData = queueSnapshot.docs.map((doc) => doc.data());

    if (queueData.length >= 2) {
      const opponent = queueData.find((player) => player.uid !== user.uid);
      if (opponent && !matchedPlayer) {
        console.log(`Match found: ${opponent.inGameName || 'Player'} (${opponent.uid})`);
        setMatchedPlayer(opponent);

        let roomId;
        let isRoomCreator = false;

        // Check if a draft room has already been created for this match
        const existingRoomRef = collection(db, 'draftRooms');
        const existingRoomQuery = query(
          existingRoomRef,
          where('userUid', 'in', [user.uid, opponent.uid]), // This query should match either user in the room
          where('opponentUid', 'in', [user.uid, opponent.uid])
        );
        const existingRoomSnapshot = await getDocs(existingRoomQuery);

        // Check if the snapshot is empty or not
        if (existingRoomSnapshot.empty) {
          // No room exists, create a new one
          roomId = uuidv4();
          isRoomCreator = true;
          console.log(`No existing room found, creating new draft room with ID: ${roomId}`);
        } else {
          // A room already exists, use the existing room ID
          roomId = existingRoomSnapshot.docs[0].id;
          console.log(`Existing room found with ID: ${roomId}`);
        }

        if (isRoomCreator) {
          // Assign player roles based on UID
          const player1 = user.uid < opponent.uid ? user : opponent;
          const player2 = user.uid > opponent.uid ? user : opponent;

          // Create the draft room in Firestore and Realtime Database
          console.log(`Creating draft room in Firestore and Realtime Database with ID: ${roomId}`);
          await setDoc(doc(db, `draftRooms/${roomId}`), {
            userUid: user.uid,
            opponentUid: opponent.uid,
          });

          await createDraftRoom(roomId, user, opponent); // Create initial data in Realtime Database
          await createOrUpdateDraftRoom(roomId, player1, player2, placeholderData); // Update with placeholder data
        }

        // Remove both players from the queue after a match is found
        await deleteDoc(doc(db, `queue/${user.uid}`));
        await deleteDoc(doc(db, `queue/${opponent.uid}`));
        console.log(`Both players (${user.uid} and ${opponent.uid}) removed from the queue.`);

        // Navigate to the draft with initialized data for player1 and player2
        navigate('/draft', {
          state: {
            player1: {
              uid: user.uid,
              inGameName: user.inGameName || 'Player',
            },
            player2: {
              uid: opponent.uid,
              inGameName: opponent.inGameName || 'Player',
            },
            draftRoomId: roomId, // Pass the shared draft room ID to Draft
          },
        });
      }
    } else {
      console.log('Not enough players in the queue.');
    }
  };

  // Listen to the queue in real-time for updates
  useEffect(() => {
    joinQueue();

    const queueRef = collection(db, 'queue');
    const unsubscribe = onSnapshot(queueRef, () => {
      handleMatchmaking(); // Call matchmaking logic whenever the queue updates
    });

    return () => {
      unsubscribe(); // Unsubscribe from real-time updates when component unmounts
    };
  }, [user, matchedPlayer, draftRoomId]);

  return (
    <div>
      <h2>Waiting for an opponent...</h2>
    </div>
  );
};

export default Match;
