import React from 'react';
import { useLocation } from 'react-router-dom';
import useDraftPhase from '../hooks/useDraftPhase';
import ReadyCheckPopup from './ReadyCheckPopup';
import TeamPanel from './TeamPanel';
import DeployedPanel from './DeployedPanel';
import MiddlePanel from './MiddlePanel';
import '../styles/Draft.css';

const Draft = ({ user }) => {
  const location = useLocation();
  const { player1: locationPlayer1, player2: locationPlayer2, draftRoomId: roomIdFromLocation } = location.state || {}; // Renamed the variable from location to avoid redeclaration

  const {
    showReadyCheck,
    handleReadyClick,
    isPlayerTurn,
    banPhase,
    pickPhase,
    currentTurn,
    timer,
    player1Data,
    player2Data,
    player1Deployed,
    player2Deployed,
    bannedCharacters,
    handlePickOrBan,
    player1Team,
    player2Team,
    isReady,
  } = useDraftPhase(user, locationPlayer1, locationPlayer2, roomIdFromLocation);

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
          pickedCharacters={player1Deployed.map((char) => char.name)} // Pass picked characters
          team={player1Team} // Pass player1's team
          side="left"
          isEnemyTeam={false} // Player 1's own team
          isPlayerTurn={isPlayerTurn && currentTurn === 1} // Only allow actions if it's Player 1's turn
        />

        {/* Deployed panel for Player 1 */}
        <DeployedPanel deployedTeam={player1Deployed || []} />

        {/* Middle panel showing the ban/pick phase and the current player turn */}
        <MiddlePanel
          banPhase={banPhase}
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
          pickedCharacters={player2Deployed.map((char) => char.name)} // Pass picked characters
          team={player2Team} // Pass player2's team
          side="right"
          isEnemyTeam={true} // Player 2's team is the enemy team for Player 1
          isPlayerTurn={isPlayerTurn && currentTurn === 2} // Only allow actions if it's Player 2's turn
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
        />
      )}
    </div>
  );
};

export default Draft;