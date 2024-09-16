import React from 'react';
import '../styles/CharacterCard.css'; // Assuming styles for the card

const CharacterCard = ({ character, isBanned, onClick }) => {
  const isEmptySlot = character.name === 'Empty Slot'; // Check if it's an empty slot

  return (
    <div
      className={`character-card ${isEmptySlot ? 'common' : character.rarity.toLowerCase()} ${isBanned ? 'disabled' : ''}`}
      onClick={onClick}
      style={{ cursor: isBanned || isEmptySlot ? 'not-allowed' : 'pointer', display: isBanned ? 'none' : 'block' }}
    >
      {!isEmptySlot ? (
        <>
          {character.imageUrl && (
            <img src={character.imageUrl} alt={character.name} className="character-image" />
          )}
          <h3>{character.name}</h3>
          {/* Conditionally render the role and faction icons if the data is available */}
          {character.roleImage && character.factionImages && character.factionImages.length > 0 && (
            <div className="character-role-faction">
              {/* Render role icon if available */}
              {character.roleImage && (
                <img src={character.roleImage} alt={character.role} className="role-icon" />
              )}
              {/* Loop through factionImages to display multiple faction icons */}
              {character.factionImages.map((image, index) => (
                <img key={index} src={image} alt={`Faction ${index}`} className="faction-icon" />
              ))}
            </div>
          )}
        </>
      ) : (
        // If it's an empty slot, only display the text "Empty Slot"
        <h3>Empty Slot</h3>
      )}
    </div>
  );
};

export default CharacterCard;
