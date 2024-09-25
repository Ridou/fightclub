// MiddlePanel.js
import React from 'react';
import '../styles/MiddlePanel.css';

const MiddlePanel = ({
  banPhase,
  currentTurn,
  player1Name,
  player2Name,
  isPlayerTurn,
  timer,
}) => {
  const currentPlayerName = currentTurn === 1 ? player1Name : player2Name;

  return (
    <div className="middle-panel">
      <h3>{banPhase ? 'Ban Phase' : 'Pick Phase'}</h3>
      <h4>Current Turn: {currentPlayerName}</h4>
      <p className="turn-indicator">{isPlayerTurn ? 'Your Turn' : "Opponent's Turn"}</p>
      <p className="timer">Time Left: {timer}s</p>
    </div>
  );
};

export default MiddlePanel;
