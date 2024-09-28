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
    player1Team,
    player2Team,
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

  // Debugging logs
  useEffect(() => {
    console.log('Draft - player1Data:', player1Data);
    console.log('Draft - player2Data:', player2Data);
  }, [player1Data, player2Data]);

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

  // Handle picking a character
  const handlePick = (character) => {
    if (!banPhaseActive && pickPhase) {
      handlePickOrBan(character, 'pick'); // Handle picking a character
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
          onBanCharacter={handleBan} // Handle ban
          onPickCharacter={handlePick} // Handle pick
          bannedCharacters={bannedCharacters.player1}
          pickedCharacters={player1Deployed.map((char) => char.name)} // Pass picked characters
          team={player1Team} // Pass player1's team
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
          onBanCharacter={handleBan}
          onPickCharacter={handlePick}
          bannedCharacters={bannedCharacters.player2}
          pickedCharacters={player2Deployed.map((char) => char.name)} // Pass picked characters
          team={player2Team} // Pass player2's team
          side="right"
        />
      </div>

      {/* Show ReadyCheckPopup until both players are ready */}
      {!isReady && (
        <ReadyCheckPopup
          handleReadyClick={handleReadyClick}
          player1={player1Data}
          player2={player2Data}
          user={user}
          draftRoomId={roomIdFromLocation}
          onReadyComplete={() => setIsReady(true)}
        />
      )}
    </div>
  );
};

export default Draft;