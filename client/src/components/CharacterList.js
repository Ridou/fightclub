import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore methods
import { db } from '../firebase'; // Import the initialized Firestore instance from firebase.js
import CharacterCard from './CharacterCard'; // Import the CharacterCard component
import '../styles/CharacterList.css'; // Assuming styles will go here

// List of unreleased characters (converted to lowercase for consistency)
const unreleasedCharacters = [
  'Acambe', 'Agatha', 'Auguste', 'Caris', 'Cocoa', 'Col', 'Hasna', 'Homa',
  'Layla', 'Pamina', 'Safiyyah', 'Schacklulu', 'Taair', 'Tristan'
].map(name => name.toLowerCase().trim()); // Ensure all names are lowercase and trimmed

// Role images map
const roleImageMap = {
  Watcher: 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/roles%2FSoC_Watcher.webp?alt=media',
  Seeker: 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/roles%2FSoC_Seeker.webp?alt=media',
  Breaker: 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/roles%2FSoC_Breaker.webp?alt=media',
  Defender: 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/roles%2FSoC_Defender.webp?alt=media',
  Destroyer: 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/roles%2FSoC_Destroyer.webp?alt=media',
};

// Faction images map
const factionImageMap = {
  'SoC': 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/factions%2FSoCFaction.png?alt=media',
  'Aggression': 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/factions%2FaggressionFaction.png?alt=media',
  'Alacrity': 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/factions%2Falacrity.png?alt=media',
  'Discipline': 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/factions%2FdisciplineFaction.png?alt=media',
  'Drifter': 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/factions%2FdrifterFaction.png?alt=media',
  'Fortitude': 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/factions%2FfortitudeFaction.png?alt=media',
  'Iria': 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/factions%2FiriaFaction.png?alt=media',
  'Night Crimson': 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/factions%2FnightCrimsonFaction.png?alt=media',
  'Papal States': 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/factions%2FpapalStatesFaction.png?alt=media',
  'The Union': 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/factions%2FunionFaction.png?alt=media',
  'Vlder': 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/factions%2FvlderFaction.png?alt=media',
};

// Utility to map factions to images
const getFactionImages = (factionString) => {
  return factionString.split(',').map(faction => factionImageMap[faction.trim()]);
};

// Function to fetch characters from Firestore
export const fetchCharacters = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'characters'));
    const characters = querySnapshot.docs.map((doc) => doc.data());

    // Log all character names to check data integrity
    console.log('Fetched characters:', characters.map(character => character.name));

    const filteredCharacters = characters.filter(character => {
      const characterName = character.name.toLowerCase().trim();

      // Log each character's name and whether it's in the unreleased list
      const isUnreleased = unreleasedCharacters.includes(characterName);
      console.log(`Checking character: ${characterName}, is unreleased: ${isUnreleased}`);

      return !isUnreleased;
    });

    return filteredCharacters.map(character => ({
      ...character,
      roleImage: roleImageMap[character.role] || '',
      factionImages: getFactionImages(character.faction),
    }));
  } catch (error) {
    console.error('Error fetching characters:', error);
    return [];
  }
};

// CharacterList component to display characters
const CharacterList = ({ onSelect, bannedCharacters = {}, player1Picks = [], player2Picks = [] }) => {
  const [allCharacters, setAllCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCharacters = async () => {
      const characters = await fetchCharacters();
      setAllCharacters(characters);
      setLoading(false);
    };

    loadCharacters();
  }, []);

  const isCharacterBannedOrPicked = (character) => (
    bannedCharacters.player1?.name === character.name ||
    bannedCharacters.player2?.name === character.name ||
    player1Picks.some(pick => pick.name === character.name) ||
    player2Picks.some(pick => pick.name === character.name)
  );

  if (loading) return <p>Loading characters...</p>;

  return (
    <div className="character-list-container">
      <div className="characters">
        {allCharacters
          .filter(character => !unreleasedCharacters.includes(character.name.toLowerCase().trim())) // Ensure unreleased characters are filtered here
          .map((character, index) => (
            <CharacterCard
              key={index}
              character={character}
              isBanned={isCharacterBannedOrPicked(character)} // Disable character if banned/picked
              onClick={() => !isCharacterBannedOrPicked(character) && onSelect(character)} // Call onSelect if not banned/picked
            />
          ))}
      </div>
    </div>
  );
};

export default CharacterList;
