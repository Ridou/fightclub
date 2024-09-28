import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import useTurnManager from './useTurnManager';
import useTimer from './useTimer';
import { rtdb } from '../firebase';
import { getUserTeam } from '../firebase'; // Import team fetching function

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
  const [player1Team, setPlayer1Team] = useState([]); // State to hold player1's team
  const [player2Team, setPlayer2Team] = useState([]); // State to hold player2's team
  const [isReady, setIsReady] = useState(false); // Track if both players are ready

  const { currentTurn, isPlayerTurn, setCurrentTurn, switchTurn, banPhase, pickPhase } = useTurnManager(user, player1, player2);
  const { timer, setTimer, resetTimer } = useTimer(60, currentTurn, isPlayerTurn, banPhase || pickPhase);

  // Function to handle banning and picking
  const handlePickOrBan = (character, actionType) => {
    const currentPlayer = currentTurn === 1 ? 'player1' : 'player2';
    const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}/${currentPlayer}`);

    if (actionType === 'ban') {
      // Ban the character and update the state and Firebase
      if (currentPlayer === 'player1' && player1Banned.length < 1) {
        setPlayer1Banned([...player1Banned, character.name]);
        update(draftRoomRef, { banned: [...player1Banned, character.name] });
      } else if (currentPlayer === 'player2' && player2Banned.length < 1) {
        setPlayer2Banned([...player2Banned, character.name]);
        update(draftRoomRef, { banned: [...player2Banned, character.name] });
      }
    } else if (actionType === 'pick') {
      // Pick the character and update the state and Firebase
      if (currentPlayer === 'player1' && player1Deployed.length < 5) {
        setPlayer1Deployed([...player1Deployed, character]);
        update(draftRoomRef, { deployed: [...player1Deployed, character] });
      } else if (currentPlayer === 'player2' && player2Deployed.length < 5) {
        setPlayer2Deployed([...player2Deployed, character]);
        update(draftRoomRef, { deployed: [...player2Deployed, character] });
      }
    }

    // Switch the turn after every pick or ban
    switchTurn();
  };

  // Function to handle ready state
  const handleReadyClick = async () => {
    const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}`);

    try {
      const updatedDraftData = {};

      // Use cached uid to update Firebase
      if (user.uid === player1?.uid) {
        updatedDraftData['player1/ready'] = true;
      } else if (user.uid === player2?.uid) {
        updatedDraftData['player2/ready'] = true;
      } else {
        console.error('User UID does not match either player1 or player2 UID');
      }

      console.log('Updated Draft Data:', updatedDraftData); // Debugging to see what's sent

      await update(draftRoomRef, updatedDraftData);

      // Check if both players are ready, then start the draft
      if (updatedDraftData['player1/ready'] && updatedDraftData['player2/ready']) {
        setShowReadyCheck(false);
        setTimer(60); // Start the timer for the first turn
        setCurrentTurn(1); // Player 1 starts
        setIsReady(true); // Set isReady to true
      }
    } catch (error) {
      console.error('Error updating draft room:', error);
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
          setIsReady(true); // Set isReady to true
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
          uid: data.player1.uid,
        }));

        setPlayer2((prev) => ({
          ...prev,
          inGameName: data.player2.inGameName || 'Player 2',
          uid: data.player2.uid,
        }));

        // Fetch teams for both players
        const fetchTeams = async () => {
          try {
            const team1 = await getUserTeam(data.player1.uid);
            const team2 = await getUserTeam(data.player2.uid);
            setPlayer1Team(team1 || []);
            setPlayer2Team(team2 || []);
          } catch (error) {
            console.error('Error fetching teams:', error);
          }
        };

        fetchTeams();

        // Debugging logs
        console.log('useDraftPhase - player1:', data.player1);
        console.log('useDraftPhase - player2:', data.player2);
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
    handleReadyClick, // Expose handleReadyClick function
    player1Ready,
    player2Ready,
    setPlayer1Ready,
    setPlayer2Ready,
    draftRoomId,
    player1Team, // Expose player1's team
    player2Team, // Expose player2's team
    isReady, // Expose isReady
    setIsReady, // Expose setIsReady
  };
};

export default useDraftPhase;