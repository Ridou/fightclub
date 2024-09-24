import { ref, set, update } from 'firebase/database';
import { rtdb } from '../firebase';  // Ensure your firebase config is properly imported

// Custom hook for creating/updating draft rooms
const useDraftRoom = () => {
  const createOrUpdateDraftRoom = async (roomId, player1, player2, placeholderData) => {
    const draftRoomRef = ref(rtdb, `draftRooms/${roomId}`);

    // Logs for debugging
    console.log(`Attempting to create or update draft room with ID: ${roomId}`);

    try {
      // First, try setting the data to ensure the room exists
      await set(draftRoomRef, {
        player1: {
          name: player1.inGameName || 'Player 1',
          uid: player1.uid,
        },
        player2: {
          name: player2.inGameName || 'Player 2',
          uid: player2.uid,
        },
        player1Deployed: placeholderData.player1Deployed || ["Placeholder1"],
        player2Deployed: placeholderData.player2Deployed || ["Placeholder2"],
        bannedCharacters: {
          player1: placeholderData.bannedCharacters.player1 || ["Placeholder1"],
          player2: placeholderData.bannedCharacters.player2 || ["Placeholder2"],
        },
        turn: 1, // Start with Player 1's turn
        banPhase: true, // Begin with Ban Phase
        timer: 60,
      });

      console.log(`Draft room ${roomId} created successfully with initial data.`);

      // After the room is created, we can use update for further adjustments
      await update(draftRoomRef, {
        turn: 1, // You can add more updates here as needed
        timer: 60,  // You can adjust the timer if required
      });

      console.log(`Draft room ${roomId} updated successfully.`);
    } catch (error) {
      console.error('Error creating or updating the draft room in Firebase:', error);
    }
  };

  return { createOrUpdateDraftRoom };
};

export default useDraftRoom;
