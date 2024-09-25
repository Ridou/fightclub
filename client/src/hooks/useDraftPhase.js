import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import useTurnManager from './useTurnManager';
import useTimer from './useTimer';
import { rtdb } from '../firebase';

const useDraftPhase = (user, locationPlayer1, locationPlayer2, draftRoomId) => {
  const [showReadyCheck, setShowReadyCheck] = useState(true);
  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState('');
  const [player1, setPlayer1] = useState(locationPlayer1 || {});
  const [player2, setPlayer2] = useState(locationPlayer2 || {});
  const [player1Deployed, setPlayer1Deployed] = useState([]);
  const [player2Deployed, setPlayer2Deployed] = useState([]);
  const [player1Banned, setPlayer1Banned] = useState([]);
  const [player2Banned, setPlayer2Banned] = useState([]);
  const [banPhase, setBanPhase] = useState(true);

  const {
    currentTurn,
    isPlayerTurn,
    setCurrentTurn,
    pickOrder,
    nextPickOrder,
  } = useTurnManager(user, player1, player2);

  const { timer, setTimer, resetTimer } = useTimer(60, currentTurn, isPlayerTurn, banPhase);

  useEffect(() => {
    const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}`);
  
    // Listen for changes in Firebase to know when both players are ready
    onValue(draftRoomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayer1Ready(data.player1.ready || false);
        setPlayer2Ready(data.player2.ready || false);
  
        if (data.player1.ready && data.player2.ready) {
          setShowReadyCheck(false);
          setTimer(60);  // Start the timer for the first turn
          setCurrentTurn(1);  // Player 1 starts
        }
  
        // Sync banned characters and deployed teams from Firebase
        if (data.player1.banned) setPlayer1Banned(data.player1.banned);
        if (data.player2.banned) setPlayer2Banned(data.player2.banned);
        if (data.player1.deployed) setPlayer1Deployed(data.player1.deployed);
        if (data.player2.deployed) setPlayer2Deployed(data.player2.deployed);
  
        // Set player names from Firebase data
        setPlayer1((prev) => ({
          ...prev,
          inGameName: data.player1.inGameName || 'Player 1',
        }));
        setPlayer2((prev) => ({
          ...prev,
          inGameName: data.player2.inGameName || 'Player 2',
        }));
      }
    });
  }, [draftRoomId]);
    

  return {
    showReadyCheck,
    isPlayerTurn,
    banPhase,
    currentTurn,
    timer,
    player1Data: player1,
    player2Data: player2,
    player1Deployed,
    player2Deployed,
    bannedCharacters: { player1: player1Banned, player2: player2Banned },
    waitingMessage,
    player1,
    player2,
    player1Ready,
    player2Ready,
    setPlayer1Ready,  // Return the setter for Player 1's readiness
    setPlayer2Ready,  // Return the setter for Player 2's readiness
    draftRoomId,
  };
};

export default useDraftPhase;
