import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ref, onValue } from 'firebase/database'; // Firebase listener
import useDraftPhase from '../hooks/useDraftPhase';
import useFirebaseSync from '../hooks/useFirebaseSync';
import ReadyCheckPopup from './ReadyCheckPopup';
import TeamPanel from './TeamPanel';
import DeployedPanel from './DeployedPanel';
import MiddlePanel from './MiddlePanel';
import '../styles/Draft.css';
import { rtdb } from '../firebase';

const Draft = ({ user }) => {
  const location = useLocation();
  const { player1: locationPlayer1, player2: locationPlayer2, draftRoomId: roomIdFromLocation } = location.state || {}; // Renamed the variable from location to avoid redeclaration

  const [isReady, setIsReady] = useState(false); // Track if both players are ready
  const [banPhaseActive, setBanPhaseActive] = useState(true); // Manage the ban phase
  const [bansCompleted, setBansCompleted] = useState({ player1: 0, player2: 0 }); // Track ban counts
  const [player1Data, setPlayer1Data] = useState({});
  const [player2Data, setPlayer2Data] = useState({});
  const [bannedCharacters, setBannedCharacters] = useState([]);

  const {
    showReadyCheck,
    handleReadyClick,
    isPlayerTurn,
    banPhase,
    pickPhase, // Added pickPhase
    currentTurn,
    timer,
    player1Deployed,
    player2Deployed,
    handlePickOrBan,
  } = useDraftPhase(user, locationPlayer1, locationPlayer2, roomIdFromLocation);

  // Use Firebase Sync
  useFirebaseSync(roomIdFromLocation, user, handlePickOrBan, setPlayer1Data, setPlayer2Data, setBannedCharacters);

  // Listen for real-time updates on the ready status of both players
  useEffect(() => {
    const draftRoomRef = ref(rtdb, `draftRooms/${roomIdFromLocation}`);

    const unsubscribe = onValue(draftRoomRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.player1?.ready && data?.player2?.ready) {
        setIsReady(true); // Start the draft if both players are ready
      }
    });

    return () => unsubscribe();
  }, [roomIdFromLocation]);

  // Handle banning a character
  const handleBan = (character) => {
    if (banPhaseActive) {
      handlePickOrBan(character, 'ban'); // Handle banning a character
      const currentPlayer = currentTurn === player1Data?.uid ? 'player1' : 'player2';
      setBansCompleted((prevState) => ({
        ...prevState,
        [currentPlayer]: prevState[currentPlayer] + 1,
      }));

      // Transition to pick phase after both players have banned two characters
      if (bansCompleted.player1 === 1 && bansCompleted.player2 === 1) {
        setBanPhaseActive(false); // End the ban phase, move to pick phase
      }
    }
  };

  return (
    <div className="draft">
      <div className="draft-header">
        <h2>Draft Room</h2>
      </div>

      <div className="draft-container">
        {/* Team panel for Player 1 */}
        <TeamPanel
          playerData={player1Data}
          isBanPhase={banPhase}
          isPickPhase={pickPhase} // Include pickPhase check
          onBanCharacter={(character) => handlePickOrBan(character, 'ban')} // Handle ban
          onPickCharacter={(character) => handlePickOrBan(character, 'pick')} // Handle pick
          bannedCharacters={bannedCharacters.player1}
          side="left"
        />

        {/* Deployed panel for Player 1 */}
        <DeployedPanel deployedTeam={player1Deployed || []} />

        {/* Middle panel showing the ban/pick phase and the current player turn */}
        <MiddlePanel
          banPhase={banPhaseActive}
          currentTurn={currentTurn}
          player1Name={player1Data?.inGameName}
          player2Name={player2Data?.inGameName}
          isPlayerTurn={isPlayerTurn}
          timer={timer}
        />

        {/* Deployed panel for Player 2 */}
        <DeployedPanel deployedTeam={player2Deployed || []} />

        {/* Team panel for Player 2 */}
        <TeamPanel
          playerData={player2Data}
          isBanPhase={banPhase}
          isPickPhase={pickPhase}
          onBanCharacter={(character) => handlePickOrBan(character, 'ban')}
          onPickCharacter={(character) => handlePickOrBan(character, 'pick')}
          bannedCharacters={bannedCharacters.player2}
          side="right"
        />
      </div>

      {/* Show ReadyCheckPopup until both players are ready */}
      {!isReady && (
        <ReadyCheckPopup
          player1={player1Data}
          player2={player2Data}
          user={user}
          draftRoomId={roomIdFromLocation}
          player1Ready={player1Data?.ready}
          player2Ready={player2Data?.ready}
          setPlayer1Ready={handleReadyClick}
          setPlayer2Ready={handleReadyClick}
        />
      )}
    </div>
  );
};

export default Draft;
