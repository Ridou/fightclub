import { ref, set, update, get } from 'firebase/database';
import { rtdb } from '../firebase';

const useDraftRoom = () => {
  // Function to create or update a draft room in Firebase
  const createOrUpdateDraftRoom = async (draftRoomId, player1, player2) => {
    try {
      const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}`);

      // First, retrieve the existing draft room data (if any)
      const draftRoomSnapshot = await get(draftRoomRef);
      const existingDraftRoom = draftRoomSnapshot.val();

      // If the draft room already exists, we only update necessary fields
      if (existingDraftRoom) {
        const updatedDraftData = {
          player1: player1 || existingDraftRoom.player1,
          player2: player2 || existingDraftRoom.player2,
          player1Deployed: existingDraftRoom.player1Deployed || [],
          player2Deployed: existingDraftRoom.player2Deployed || [],
          bannedCharacters: existingDraftRoom.bannedCharacters || { player1: [], player2: [] },
          turn: existingDraftRoom.turn || 1,  // Keep the current turn if it exists
          banPhase: existingDraftRoom.banPhase !== undefined ? existingDraftRoom.banPhase : true,
          player1Ready: existingDraftRoom.player1Ready || false,
          player2Ready: existingDraftRoom.player2Ready || false,
        };

        // Update only the fields that need to be changed
        await update(draftRoomRef, updatedDraftData);
        console.log('Draft room updated successfully.');
      } else {
        // If the draft room does not exist, create it with initial data
        const initialDraftData = {
          player1: player1 || {},
          player2: player2 || {},
          player1Deployed: [],
          player2Deployed: [],
          bannedCharacters: { player1: [], player2: [] },
          turn: 1,  // Player 1 starts
          banPhase: true,  // Start with the ban phase
          player1Ready: false,
          player2Ready: false,
        };

        await set(draftRoomRef, initialDraftData);
        console.log('Draft room created successfully.');
      }
    } catch (error) {
      console.error('Error creating or updating the draft room in Firebase:', error);
    }
  };

  return { createOrUpdateDraftRoom };
};

export default useDraftRoom;
