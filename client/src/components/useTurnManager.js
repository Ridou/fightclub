// useTurnManager.js
import { useState, useEffect } from 'react';

const useTurnManager = (user, player1, player2) => {
  const [currentTurn, setCurrentTurn] = useState(1);
  const [pickOrder, setPickOrder] = useState([1, 2, 2, 1, 1, 2, 2, 1, 1, 2]);

  const isPlayerTurn = user.uid === (currentTurn === 1 ? player1.uid : player2.uid);

  const nextPickOrder = () => {
    const nextTurn = pickOrder.shift();
    setPickOrder(pickOrder);
    return nextTurn;
  };

  return {
    currentTurn,
    setCurrentTurn,
    isPlayerTurn,
    pickOrder,
    nextPickOrder,
  };
};

export default useTurnManager;
