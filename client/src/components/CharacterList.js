import React from 'react';
import CharacterCard from '/CharacterCard'; // Import the reusable CharacterCard component

const CharacterList = () => {
  // Example character data (you can replace this with dynamic data)
  const characters = [
    { name: 'Abyss', imageUrl: 'https://swordofconvallaria.co/wp-content/uploads/2024/08/Abyss_card.webp' },
    { name: 'Acambe', imageUrl: 'https://swordofconvallaria.co/wp-content/uploads/2024/08/Acambe_card.webp' },
    // Add more characters dynamically here
  ];

  return (
    <div className="characters-list">
      {characters.map((character, index) => (
        <CharacterCard key={index} character={character} />
      ))}
    </div>
  );
};

export default CharacterList;
