import React, { useEffect } from 'react';
import CharacterCard from './CharacterCard';
import '../styles/TeamPanel.css';

const TeamPanel = ({
  playerData,
  isBanPhase,
  isPickPhase, // Now handling pick phase as well
  onBanCharacter,
  onPickCharacter, // Add pick character function
  bannedCharacters = [],
  pickedCharacters = [], // Track picked characters
  team = [], // Receive team as a prop
  side,
  isEnemyTeam = false, // New prop to indicate if this is the enemy team
  isPlayerTurn, // New prop to indicate if it's the player's turn
}) => {
  // Log the received props for debugging
  useEffect(() => {
    console.log(`TeamPanel (${side}) - playerData:`, playerData);
    console.log(`TeamPanel (${side}) - team:`, team);
    console.log(`TeamPanel (${side}) - bannedCharacters:`, bannedCharacters);
    console.log(`TeamPanel (${side}) - pickedCharacters:`, pickedCharacters);
  }, [playerData, team, bannedCharacters, pickedCharacters, side]);

  // Disable a character if it is banned or already picked
  const isCharacterDisabled = (character) => {
    return (
      bannedCharacters.includes(character.name) ||
      pickedCharacters.includes(character.name) // Prevent picking the same character again
    );
  };

  return (
    <div className={`team-panel ${side}`}>
      <h3>{playerData?.inGameName || 'Player'}</h3>
      <div className="team-grid">
        {team.length > 0 ? (
          team.map((character, index) => (
            <CharacterCard
              key={index}
              character={character}
              onClick={
                isPlayerTurn && isBanPhase && isEnemyTeam
                  ? () => onBanCharacter(character)
                  : isPlayerTurn && isPickPhase && !isEnemyTeam
                  ? () => onPickCharacter(character)
                  : null
              }
              disabled={isCharacterDisabled(character)} // Disable if banned or picked
            />
          ))
        ) : (
          <p>No team available</p>
        )}
      </div>
    </div>
  );
};

export default TeamPanel;