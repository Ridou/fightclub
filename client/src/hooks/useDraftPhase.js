import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import useTurnManager from './useTurnManager';
import useTimer from './useTimer';
import { rtdb } from '../firebase';

const useDraftPhase = (user, locationPlayer1, locationPlayer2, draftRoomId) => {
  const [showReadyCheck, setShowReadyCheck] = useState(true);
  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);
  const [player1, setPlayer1] = useState(locationPlayer1 || {});
  const [player2, setPlayer2] = useState(locationPlayer2 || {});
  const [player1Deployed, setPlayer1Deployed] = useState([]);
  const [player2Deployed, setPlayer2Deployed] = useState([]);
  const [player1Banned, setPlayer1Banned] = useState([]);
  const [player2Banned, setPlayer2Banned] = useState([]);
  const [banPhase, setBanPhase] = useState(true);
  const [pickPhase, setPickPhase] = useState(false); // New state for pick phase

  const { currentTurn, isPlayerTurn, setCurrentTurn, switchTurn } = useTurnManager(user, player1, player2);
  const { timer, setTimer, resetTimer } = useTimer(60, currentTurn, isPlayerTurn, banPhase || pickPhase);

  // Function to handle banning and picking
  const handlePickOrBan = (character, actionType) => {
    const currentPlayer = currentTurn === player1.uid ? 'player1' : 'player2';
    const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}/${currentPlayer}`);

    if (actionType === 'ban') {
      // Ban the character and update the state and Firebase
      if (currentPlayer === 'player1') {
        setPlayer1Banned([...player1Banned, character]);
        update(draftRoomRef, { banned: [...player1Banned, character] });
      } else {
        setPlayer2Banned([...player2Banned, character]);
        update(draftRoomRef, { banned: [...player2Banned, character] });
      }
    } else if (actionType === 'pick') {
      // Pick the character and update the state and Firebase
      if (currentPlayer === 'player1') {
        setPlayer1Deployed([...player1Deployed, character]);
        update(draftRoomRef, { deployed: [...player1Deployed, character] });
      } else {
        setPlayer2Deployed([...player2Deployed, character]);
        update(draftRoomRef, { deployed: [...player2Deployed, character] });
      }
    }

    // Switch the turn after every pick or ban
    switchTurn();

    // Check if we need to transition between phases
    if (banPhase && player1Banned.length >= 2 && player2Banned.length >= 2) {
      setBanPhase(false);
      setPickPhase(true); // Start the pick phase
    }
  };

  // Firebase sync - Only trigger updates when data changes
  useEffect(() => {
    const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}`);

    const unsubscribe = onValue(draftRoomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayer1Ready(data.player1.ready || false);
        setPlayer2Ready(data.player2.ready || false);

        if (data.player1.ready && data.player2.ready) {
          setShowReadyCheck(false);
          setTimer(60); // Start the timer for the first turn
          setCurrentTurn(1); // Player 1 starts
        }

        // Sync banned and deployed characters from Firebase
        setPlayer1Banned(data.player1.banned || []);
        setPlayer2Banned(data.player2.banned || []);
        setPlayer1Deployed(data.player1.deployed || []);
        setPlayer2Deployed(data.player2.deployed || []);

        // Set player names from Firebase
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

    return () => unsubscribe();
  }, [draftRoomId]);

  return {
    showReadyCheck,
    isPlayerTurn,
    banPhase,
    pickPhase, // Expose pickPhase
    currentTurn,
    timer,
    player1Data: player1,
    player2Data: player2,
    player1Deployed,
    player2Deployed,
    bannedCharacters: { player1: player1Banned, player2: player2Banned },
    handlePickOrBan, // Expose handlePickOrBan function
    player1Ready,
    player2Ready,
    setPlayer1Ready,
    setPlayer2Ready,
    draftRoomId,
  };
};

export default useDraftPhase;
