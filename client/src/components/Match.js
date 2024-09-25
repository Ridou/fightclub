import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, deleteDoc, getDoc, onSnapshot, query, where, limit } from 'firebase/firestore';
import { ref, get, update, set, child, runTransaction } from 'firebase/database'; 
import { db, rtdb } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

const Match = ({ user }) => {
  const navigate = useNavigate();
  const [draftRoomId, setDraftRoomId] = useState(null);

  // Fetch player's inGameName from Firestore
  const fetchInGameName = async (uid) => {
    try {
      const userDocRef = doc(db, `users/${uid}`);
      const userDocSnapshot = await getDoc(userDocRef);
      if (userDocSnapshot.exists() && userDocSnapshot.data().inGameName) {
        return userDocSnapshot.data().inGameName;
      } else {
        console.log('InGameName not found, using default "Player".');
        return 'Player';
      }
    } catch (error) {
      console.error('Error fetching inGameName:', error);
      return 'Player';
    }
  };

  // Assign players based on UID and randomize
  const assignPlayers = (user1, user2) => {
    let [player1, player2] = user1.uid < user2.uid ? [user1, user2] : [user2, user1];

    // Randomize who is Player 1 and Player 2
    if (Math.random() < 0.5) {
      [player1, player2] = [player2, player1];
    }

    return { player1, player2 };
  };

  // Check for existing draft room in Realtime Database
  const findExistingDraftRoom = async (uid1, uid2) => {
    try {
      const draftRoomsRef = ref(rtdb, 'draftRooms');
      const snapshot = await get(draftRoomsRef);
      const draftRooms = snapshot.exists() ? snapshot.val() : null;

      if (!draftRooms) return null;

      for (const roomId in draftRooms) {
        const room = draftRooms[roomId];
        if (
          (room.player1?.uid === uid1 || room.player1?.uid === uid2) &&
          (room.player2?.uid === uid1 || room.player2?.uid === uid2)
        ) {
          return { roomId, room };
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding existing draft room:', error);
      return null;
    }
  };

  // Create or join a draft room in Realtime Database with a transaction
  const createOrJoinDraftRoom = async (opponent) => {
    try {
      const player1InGameName = await fetchInGameName(user.uid);
      const player2InGameName = await fetchInGameName(opponent.uid);

      // First, check if there is already an existing room for these two players
      const existingRoom = await findExistingDraftRoom(user.uid, opponent.uid);

      if (existingRoom) {
        console.log(`Found existing draft room with ID: ${existingRoom.roomId}`);
        return existingRoom.roomId;
      } else {
        // Use a transaction to ensure only one room is created
        const draftRoomsRef = ref(rtdb, 'draftRooms');
        let roomId = null;

        await runTransaction(draftRoomsRef, (draftRooms) => {
          if (draftRooms) {
            // Check again for an existing room inside the transaction
            for (const id in draftRooms) {
              const room = draftRooms[id];
              if (
                (room.player1?.uid === user.uid || room.player1?.uid === opponent.uid) &&
                (room.player2?.uid === user.uid || room.player2?.uid === opponent.uid)
              ) {
                roomId = id; // Found existing room
                return draftRooms; // Abort transaction, no need to create a new room
              }
            }
          }
          // If no room exists, create a new one
          roomId = uuidv4();
          const { player1, player2 } = assignPlayers(
            { uid: user.uid, inGameName: player1InGameName, ready: false },
            { uid: opponent.uid, inGameName: player2InGameName, ready: false }
          );

          draftRooms = {
            ...draftRooms,
            [roomId]: {
              player1,
              player2
            }
          };
          return draftRooms;
        });

        console.log(`Room ID after transaction: ${roomId}`);
        return roomId;
      }
    } catch (error) {
      console.error('Error creating or joining draft room:', error);
      return null;
    }
  };

  // Handle matchmaking process
  const handleMatchmaking = async () => {
    console.log('Starting matchmaking...');

    try {
      const q = query(
        collection(db, 'queue'),
        where('uid', '!=', user.uid),
        limit(1)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (snapshot.size > 0) {
          const opponentDoc = snapshot.docs[0];
          const opponent = opponentDoc.data();

          console.log('Opponent found:', opponent);

          const roomId = await createOrJoinDraftRoom(opponent);

          if (roomId) {
            setDraftRoomId(roomId);

            const roomData = await get(child(ref(rtdb), `draftRooms/${roomId}`));

            // Check if roomData exists and is not null before accessing player1 and player2
            if (roomData.exists()) {
              const roomVal = roomData.val();

              const player1 = roomVal.player1;
              const player2 = roomVal.player2;

              console.log('Navigating to /draft with state:', { player1, player2, draftRoomId: roomId });

              await deleteDoc(doc(db, `queue/${user.uid}`));
              await deleteDoc(doc(db, `queue/${opponent.uid}`));

              navigate('/draft', {
                state: {
                  player1,
                  player2,
                  draftRoomId: roomId,
                },
              });
            } else {
              console.error('Room data is null or not available');
            }
          }
        } else {
          console.log('No opponent found in the queue.');
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error during matchmaking:', error);
    }
  };

  // Add player to the queue
  useEffect(() => {
    const joinQueue = async () => {
      try {
        const queueRef = doc(db, `queue/${user.uid}`);
        await setDoc(queueRef, {
          uid: user.uid,
          inGameName: user.inGameName || 'Player',
        });
        console.log('Player added to the queue:', user.uid);

        handleMatchmaking();
      } catch (error) {
        console.error('Error adding player to the queue:', error);
      }
    };

    if (user) {
      joinQueue();
    }
  }, [user]);

  return (
    <div>
      <h2>Waiting for an opponent...</h2>
      {draftRoomId && <p>Draft Room ID: {draftRoomId}</p>}
    </div>
  );
};

export default Match;
