import React, { useEffect } from 'react';
import '../styles/CharacterCard.css'; // Assuming styles for the card

const CharacterCard = ({ character, isBanned, onClick }) => {
  const isEmptySlot = character.name === 'Empty Slot'; // Check if it's an empty slot

  useEffect(() => {
  }, [character, isBanned, isEmptySlot]);

  return (
    <div
      className={`character-card ${isEmptySlot ? 'common' : character.rarity.toLowerCase()} ${isBanned ? 'banned' : ''}`}
      onClick={!isBanned && !isEmptySlot ? onClick : null} // Disable clicking if banned or empty
      style={{ cursor: isBanned || isEmptySlot ? 'not-allowed' : 'pointer' }}
    >
      {!isEmptySlot ? (
        <>
          {character.imageUrl && (
            <img src={character.imageUrl} alt={character.name} className="character-image" />
          )}
          <h3>{character.name}</h3>
          {character.roleImage && character.factionImages && character.factionImages.length > 0 && (
            <div className="character-role-faction">
              {character.roleImage && (
                <img src={character.roleImage} alt={character.role} className="role-icon" />
              )}
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
