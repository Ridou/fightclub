import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
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

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// List of unreleased characters (global filtering logic)
const unreleasedCharacters = [
  'Acambe', 'Agatha', 'Auguste', 'Caris', 'Cocoa', 'Col', 'Hasna', 
  'Homa', 'Layla', 'Pamina', 'Safiyyah', 'Schacklulu', 'Taair', 'Tristan'
];

const CharacterList = ({ onSelect, bannedCharacters, player1Picks, player2Picks }) => {
  const [allCharacters, setAllCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch characters from Firestore
  useEffect(() => {
    const fetchCharacters = async () => {
      const querySnapshot = await getDocs(collection(db, 'characters'));
      const characters = querySnapshot.docs
        .map((doc) => doc.data())
        .filter(character => !unreleasedCharacters.includes(character.name)); // Exclude unreleased characters
      setAllCharacters(characters);
      setLoading(false);
    };

    fetchCharacters();
  }, []);

  // Check if the character is banned or picked
  const isCharacterBannedOrPicked = (character) => {
    return (
      bannedCharacters.player1?.name === character.name ||
      bannedCharacters.player2?.name === character.name ||
      player1Picks.some((pick) => pick.name === character.name) ||
      player2Picks.some((pick) => pick.name === character.name)
    );
  };

  if (loading) return <p>Loading characters...</p>;

  return (
    <div className="character-list-container">
      <div className="characters-header">
        <h2>Characters</h2>
      </div>
      <div className="characters">
        {allCharacters.map((character, index) => (
          <div
            key={index}
            className={`character-card ${isCharacterBannedOrPicked(character) ? 'disabled' : ''}`}
            onClick={() => !isCharacterBannedOrPicked(character) && onSelect(character)}
          >
            <img src={character.imageUrl} alt={character.name} />
            <h3>{character.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterList;
