import React, { useEffect, useState } from 'react';
import CharacterCard from './CharacterCard';
import { getUserTeam } from '../firebase'; // Import team fetching function
import '../styles/TeamPanel.css';

const TeamPanel = ({
  playerData,
  isBanPhase,
  isPickPhase, // Now handling pick phase as well
  onBanCharacter,
  onPickCharacter, // Add pick character function
  bannedCharacters = [],
  pickedCharacters = [], // Track picked characters
  side
}) => {
  const [team, setTeam] = useState([]); // Local state to hold the fetched team

  useEffect(() => {
    const fetchTeam = async () => {
      if (playerData?.uid) {
        try {
          const fetchedTeam = await getUserTeam(playerData.uid);
          setTeam(fetchedTeam || []);
        } catch (error) {
          console.error(`Error fetching team for UID: ${playerData.uid}`, error);
          setTeam([]); // Default to an empty array if there was an error
        }
      }
    };

    fetchTeam();
  }, [playerData?.uid]);

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
