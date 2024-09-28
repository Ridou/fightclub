import React, { useEffect, useState } from 'react';
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
  side
}) => {
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
                isBanPhase
                  ? () => onBanCharacter(character)
                  : isPickPhase
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
