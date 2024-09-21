import React, { useEffect } from 'react';
import '../styles/CharacterCard.css'; // Assuming styles for the card

const CharacterCard = ({ character, isBanned, onClick }) => {
  // Ensure character properties have default values if undefined
  const characterName = character?.name || 'Unknown';
  const characterRarity = character?.rarity ? character.rarity.toLowerCase() : 'common';
  const characterImageUrl = character?.imageUrl || 'default-image.png'; // Default image if none provided
  const isEmptySlot = characterName === 'Empty Slot'; // Check if it's an empty slot

  useEffect(() => {}, [character, isBanned, isEmptySlot]);

  return (
    <div
      className={`character-card ${isEmptySlot ? 'common' : characterRarity} ${isBanned ? 'banned' : ''}`}
      onClick={!isBanned && !isEmptySlot ? onClick : null} // Disable clicking if banned or empty
      style={{ cursor: isBanned || isEmptySlot ? 'not-allowed' : 'pointer' }}
    >
      {!isEmptySlot ? (
        <>
          {characterImageUrl && (
            <img src={characterImageUrl} alt={characterName} className="character-image" />
          )}
          <h3>{characterName}</h3>
          {character?.roleImage && character?.factionImages?.length > 0 && (
            <div className="character-role-faction">
              <img src={character.roleImage} alt={character?.role} className="role-icon" />
              {character.factionImages.map((image, index) => (
                <img key={index} src={image} alt={`Faction ${index}`} className="faction-icon" />
              ))}
            </div>
          )}
        </>
      ) : (
        <h3>Empty Slot</h3>
      )}
    </div>
  );
};

export default CharacterCard;
