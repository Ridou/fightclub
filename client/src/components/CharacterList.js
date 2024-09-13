import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import CharacterCard from './CharacterCard'; // Import the CharacterCard component
import '../styles/CharacterList.css'; // Assuming styles will go here

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const unreleasedCharacters = [
  'Acambe', 'Agatha', 'Auguste', 'Caris', 'Cocoa', 'Col', 'Hasna', 'Homa', 
  'Layla', 'Pamina', 'Safiyyah', 'Schacklulu', 'Taair', 'Tristan'
];

const roleImageMap = {
  Watcher: 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/roles%2FSoC_Watcher.webp?alt=media',
  Seeker: 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/roles%2FSoC_Seeker.webp?alt=media',
  Breaker: 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/roles%2FSoC_Breaker.webp?alt=media',
  Defender: 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/roles%2FSoC_Defender.webp?alt=media',
  Destroyer: 'https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/roles%2FSoC_Destroyer.webp?alt=media',
};

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

// Function to fetch characters from Firebase
export const fetchCharacters = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'characters'));
    const characters = querySnapshot.docs
      .map((doc) => doc.data())
      .filter(character => !unreleasedCharacters.includes(character.name));

    return characters.map(character => ({
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
        {allCharacters.map((character, index) => (
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
