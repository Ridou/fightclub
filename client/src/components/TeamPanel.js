import React from 'react';
import CharacterCard from './CharacterCard';
import '../styles/TeamPanel.css';

const TeamPanel = ({
  playerData,
  isPlayerTurn,
  bannedCharacters,
  handlePickOrBan,
  currentTurn,
  user,
  side,
}) => {
  const isCurrentPlayer = user.uid === playerData?.uid;

  return (
    <div className={`team-panel ${side}`}>
      <h3>{playerData?.inGameName || 'Player'}</h3>
      <div className="team-grid">
        {playerData?.team?.map((character, index) => (
          <CharacterCard
            key={index}
            character={character}
            isBanned={
              bannedCharacters?.player1?.includes(character.name) ||
              bannedCharacters?.player2?.includes(character.name)
            }
            onClick={() => handlePickOrBan(character)}
            disabled={
              !isPlayerTurn ||
              !isCurrentPlayer ||
              bannedCharacters?.player1?.includes(character.name) ||
              bannedCharacters?.player2?.includes(character.name)
            }
          />
        ))}
      </div>
    </div>
  );
};

export default TeamPanel;
