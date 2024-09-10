import React from 'react';

const CharacterCard = ({ character }) => {
  return (
    <div className="character-card">
      <img src={character.imageUrl} alt={character.name} />
      <h3>{character.name}</h3>
    </div>
  );
};

export default CharacterCard;
