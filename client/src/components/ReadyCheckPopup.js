import React, { useState } from 'react';
import { ref, update } from 'firebase/database';
import '../styles/ReadyCheck.css';
import { rtdb } from '../firebase';

const ReadyCheckPopup = ({
  player1,
  player2,
  user,
  draftRoomId,
}) => {
  const [waitingMessage, setWaitingMessage] = useState('');

  const handleReadyClick = async () => {
    const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}`);

    try {
      const updatedDraftData = {};

      if (player1 && player2) {
        if (user.uid === player1.uid) {
          updatedDraftData['player1/ready'] = true;
          updatedDraftData['player1/inGameName'] = player1.inGameName || 'Player 1';
          updatedDraftData['player1/uid'] = player1.uid;
          console.log('Player 1 is ready');
        } else if (user.uid === player2.uid) {
          updatedDraftData['player2/ready'] = true;
          updatedDraftData['player2/inGameName'] = player2.inGameName || 'Player 2';
          updatedDraftData['player2/uid'] = player2.uid;
          console.log('Player 2 is ready');
        } else {
          console.error('User does not match either player1 or player2.');
          return;
        }

        // Update the draft room with the new ready state
        await update(draftRoomRef, updatedDraftData);
        setWaitingMessage('Waiting for opponent to be ready...');
      } else {
        console.error('Player1 or Player2 is undefined.');
        setWaitingMessage('Error: Players not properly initialized.');
      }
    } catch (error) {
      console.error('Error updating draft room ready status:', error);
      setWaitingMessage('Error updating draft room. Please try again.');
    }
  };

  return (
    <div className="ready-check-overlay">
      <div className="ready-check-modal">
        <h2>Ready Check</h2>
        <p>{waitingMessage || 'Please click "Ready" to begin the draft'}</p>
        {/* Safely checking for player readiness */}
        <button
          onClick={handleReadyClick}
          disabled={(player1 && player1.ready) || (player2 && player2.ready)}>
          Ready
        </button>
      </div>
    </div>
  );
};

export default ReadyCheckPopup;
