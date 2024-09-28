// src/hooks/useTurnManager.js
import { useState } from 'react';

const useTurnManager = (user, player1, player2) => {
  const [currentTurn, setCurrentTurn] = useState(1); // 1 for player1, 2 for player2
  const [turnOrder, setTurnOrder] = useState([1, 2, 1, 2, 1, 2, 1, 2]); // Define the turn order
  const [turnIndex, setTurnIndex] = useState(0);
  const [banPhase, setBanPhase] = useState(true);
  const [pickPhase, setPickPhase] = useState(false);

  const isPlayerTurn = user.uid === (currentTurn === 1 ? player1.uid : player2.uid);

  const switchTurn = () => {
    const nextTurnIndex = (turnIndex + 1) % turnOrder.length;
    setTurnIndex(nextTurnIndex);
    setCurrentTurn(turnOrder[nextTurnIndex]);

    // Transition between phases
    if (banPhase && nextTurnIndex === 2) {
      setBanPhase(false);
      setPickPhase(true);
    }
  };

  return {
    currentTurn,
    isPlayerTurn,
    setCurrentTurn,
    switchTurn,
    banPhase,
    pickPhase,
  };
};

export default useTurnManager;