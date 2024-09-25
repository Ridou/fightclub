// Draft.js
import React from 'react';
import { useLocation } from 'react-router-dom';
import useDraftPhase from '../hooks/useDraftPhase';
import useFirebaseSync from '../hooks/useFirebaseSync';
import ReadyCheckPopup from './ReadyCheckPopup';
import TeamPanel from './TeamPanel';
import DeployedPanel from './DeployedPanel';
import MiddlePanel from './MiddlePanel';
import '../styles/Draft.css';

const Draft = ({ user }) => {
  const location = useLocation();
  const { player1: locationPlayer1, player2: locationPlayer2, draftRoomId } = location.state || {};

  // Log draft information for debugging
  console.log("Entering Draft Room:", draftRoomId);
  console.log("Player 1:", locationPlayer1);
  console.log("Player 2:", locationPlayer2);

  // Pass `player1`, `player2`, `draftRoomId` from `location.state` into `useDraftPhase`
  const {
    showReadyCheck,
    handleReadyClick,
    isPlayerTurn,
    banPhase,
    currentTurn,
    timer,
    player1Data,
    player2Data,
    player1Deployed,
    player2Deployed,
    bannedCharacters,
    handlePickOrBan,
  } = useDraftPhase(user, locationPlayer1, locationPlayer2, draftRoomId);

  useFirebaseSync(draftRoomId, user, handlePickOrBan);

  return (
    <div className="draft">
      <div className="draft-header">
        <h2>Draft Room</h2>
      </div>

      <div className="draft-container">
        <TeamPanel
          playerData={player1Data}
          isPlayerTurn={isPlayerTurn}
          bannedCharacters={bannedCharacters}
          handlePickOrBan={handlePickOrBan}
          currentTurn={currentTurn}
          user={user}
          side="left"
        />

        <DeployedPanel deployedTeam={player1Deployed || []} />

        <MiddlePanel
          banPhase={banPhase}
          currentTurn={currentTurn}
          player1Name={player1Data?.inGameName}
          player2Name={player2Data?.inGameName}
          isPlayerTurn={isPlayerTurn}
          timer={timer}
        />

        <DeployedPanel deployedTeam={player2Deployed || []} />

        <TeamPanel
          playerData={player2Data}
          isPlayerTurn={isPlayerTurn}
          bannedCharacters={bannedCharacters}
          handlePickOrBan={handlePickOrBan}
          currentTurn={currentTurn}
          user={user}
          side="right"
        />
      </div>

      {/* Pass the necessary props to ReadyCheckPopup */}
      {showReadyCheck && (
        <ReadyCheckPopup
          player1={player1Data}
          player2={player2Data}
          user={user}
          draftRoomId={draftRoomId}
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
