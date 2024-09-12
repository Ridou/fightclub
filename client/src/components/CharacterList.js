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

const CharacterList = () => {
  const [allCharacters, setAllCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch characters from Firestore
  useEffect(() => {
    const fetchCharacters = async () => {
      const querySnapshot = await getDocs(collection(db, 'characters'));
      const characters = querySnapshot.docs.map((doc) => doc.data());
      setAllCharacters(characters);
      setLoading(false);
    };

    fetchCharacters();
  }, []);

  if (loading) return <p>Loading characters...</p>;

  return (
    <div className="character-list-container">
      <div className="characters-header">
        <h2>Characters</h2>
      </div>
      <div className="characters">
        {allCharacters.map((character, index) => (
          <a
            key={index}
            href={`https://swordofconvallaria.co/characters/${character.name.toLowerCase()}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="character-link"
          >
            <div className="character-card">
              <img src={character.imageUrl} alt={character.name} />
              <h3>{character.name}</h3>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default CharacterList;
