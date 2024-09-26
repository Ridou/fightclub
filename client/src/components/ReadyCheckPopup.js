import React, { useState } from 'react';
import { ref, update } from 'firebase/database';
import '../styles/ReadyCheck.css';
import { rtdb } from '../firebase';

const ReadyCheckPopup = ({ player1, player2, user, draftRoomId, onReadyComplete }) => {
  const [waitingMessage, setWaitingMessage] = useState('');

  const handleReadyClick = async () => {
    const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}`);

    try {
      const updatedDraftData = {};

      // Use cached uid to update Firebase
      if (user.uid === player1?.uid) {
        updatedDraftData['player1/ready'] = true;
      } else if (user.uid === player2?.uid) {
        updatedDraftData['player2/ready'] = true;
      }

      console.log('Updated Draft Data:', updatedDraftData); // Debugging to see what's sent

      await update(draftRoomRef, updatedDraftData);

      setWaitingMessage('Waiting for opponent to be ready...');

      // Check if both players are ready, then call onReadyComplete
      if (player1?.ready && player2?.ready) {
        onReadyComplete(); // Start draft when both players are ready
      }
    } catch (error) {
      setWaitingMessage('Error updating draft room. Please try again.');
    }
  };

  return (
    <div className="ready-check-overlay">
      <div className="ready-check-modal">
        <h2>Ready Check</h2>
        <p>{waitingMessage || 'Please click "Ready" to begin the draft'}</p>
        <button onClick={handleReadyClick} disabled={player1?.ready || player2?.ready}>
          Ready
        </button>
      </div>
    </div>
  );
};

export default ReadyCheckPopup;
