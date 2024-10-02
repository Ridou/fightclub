import React from 'react';
import { useLocation } from 'react-router-dom';
import useDraftPhase from '../hooks/useDraftPhase';
import ReadyCheckPopup from '../components/ReadyCheckPopup';
import TeamPanel from '../components/TeamPanel';
import DeployedPanel from '../components/DeployedPanel';
import MiddlePanel from '../components/MiddlePanel';
import '../styles/Draft.css';

const DraftPage = ({ user, draftRoomId }) => {
  const location = useLocation();
  const { player1: locationPlayer1, player2: locationPlayer2, draftRoomId: roomIdFromLocation } = location.state || {};

  const {
    showReadyCheck,
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
    handleReadyClick,
    player1Ready,
    player2Ready,
    setPlayer1Ready,
    setPlayer2Ready,
    draftRoomId: roomId,
    player1Team,
    player2Team,
    isReady,
    setIsReady,
  } = useDraftPhase(user, locationPlayer1, locationPlayer2, draftRoomId);

  return (
    <div className="draft-page">
      <div className="draft-container">
        <TeamPanel
          playerData={player1Data}
          isBanPhase={banPhase}
          isPickPhase={pickPhase}
          onBanCharacter={(character) => handlePickOrBan(character, 'ban')}
          onPickCharacter={(character) => handlePickOrBan(character, 'pick')}
          bannedCharacters={bannedCharacters.player1}
          pickedCharacters={player1Deployed.map((char) => char.name)}
          team={player1Team}
          side="left"
          isEnemyTeam={currentTurn === 2}
          isPlayerTurn={isPlayerTurn && currentTurn === 1}
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
          isBanPhase={banPhase}
          isPickPhase={pickPhase}
          onBanCharacter={(character) => handlePickOrBan(character, 'ban')}
          onPickCharacter={(character) => handlePickOrBan(character, 'pick')}
          bannedCharacters={bannedCharacters.player2}
          pickedCharacters={player2Deployed.map((char) => char.name)}
          team={player2Team}
          side="right"
          isEnemyTeam={currentTurn === 1}
          isPlayerTurn={isPlayerTurn && currentTurn === 2}
        />
      </div>
    </div>
  );
};

export default DraftPage;