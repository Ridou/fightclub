import React, { useState, useEffect } from 'react';
import ReadyCheckPopup from './ReadyCheckPopup';
import TeamPanel from './TeamPanel';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

const DraftPage = ({ user, draftRoomId }) => {
  const [ready, setReady] = useState(false); // Manage ready state
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [player1BannedCharacters, setPlayer1BannedCharacters] = useState([]);
  const [player2BannedCharacters, setPlayer2BannedCharacters] = useState([]);

  // Listen to updates in the Realtime Database for the draft room
  useEffect(() => {
    const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}`);
    
    const unsubscribe = onValue(draftRoomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayer1(data.player1 || {});
        setPlayer2(data.player2 || {});
        setPlayer1BannedCharacters(data.player1?.bannedCharacters || []);
        setPlayer2BannedCharacters(data.player2?.bannedCharacters || []);
      }
    });

    return () => unsubscribe();
  }, [draftRoomId]);

  const handleReadyComplete = () => {
    setReady(true); // Both players are ready, proceed with the draft
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

export default DraftPage;