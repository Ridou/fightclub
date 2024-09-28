import React, { useState } from 'react';
import '../styles/ReadyCheck.css';

const ReadyCheckPopup = ({ handleReadyClick, player1, player2, user, draftRoomId, onReadyComplete }) => {
  const [waitingMessage, setWaitingMessage] = useState('');

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