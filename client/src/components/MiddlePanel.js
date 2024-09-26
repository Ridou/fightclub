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
      <img src="https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/maps%2Fimage_2024-09-16_004427236.png?alt=media&token=d82fe782-a30e-412e-86ea-31de678c96ca" alt="Map" className="map" />
    </div>
  );
};

export default MiddlePanel;
