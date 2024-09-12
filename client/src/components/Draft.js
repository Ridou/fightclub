import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import '../styles/Draft.css'; // Assuming the styles are here

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

// List of unreleased characters
const unreleasedCharacters = [
  'Acambe', 'Agatha', 'Auguste', 'Caris', 'Cocoa', 'Col', 'Hasna', 
  'Homa', 'Layla', 'Pamina', 'Safiyyah', 'Schacklulu', 'Taair', 'Tristan'
];

const Draft = () => {
  const [allCharacters, setAllCharacters] = useState([]);
  const [player1Picks, setPlayer1Picks] = useState([]);
  const [player2Picks, setPlayer2Picks] = useState([]);
  const [bannedCharacters, setBannedCharacters] = useState({ player1: null, player2: null });
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [loading, setLoading] = useState(true);
  const [banPhase, setBanPhase] = useState(true);

  // Fetch characters from Firestore on component mount
  useEffect(() => {
    const fetchCharacters = async () => {
      const querySnapshot = await getDocs(collection(db, 'characters'));
      let characters = querySnapshot.docs.map((doc) => doc.data());

      // Filter out unreleased characters
      characters = characters.filter(character => !unreleasedCharacters.includes(character.name));
      
      setAllCharacters(characters);
      setLoading(false);
    };

    fetchCharacters();
  }, []);

  // Handle banning and picking characters
  const handlePick = (character) => {
    if (banPhase) {
      // Banning phase logic
      if (currentPlayer === 1 && !bannedCharacters.player1) {
        setBannedCharacters({ ...bannedCharacters, player1: character });
        setCurrentPlayer(2);
      } else if (currentPlayer === 2 && !bannedCharacters.player2) {
        setBannedCharacters({ ...bannedCharacters, player2: character });
        setCurrentPlayer(1);
        setBanPhase(false); // End ban phase after each player bans 1 character
      }
    } else {
      // Picking phase logic
      if (currentPlayer === 1 && player1Picks.length < 5) {
        setPlayer1Picks([...player1Picks, character]);
        setCurrentPlayer(2);
      } else if (currentPlayer === 2 && player2Picks.length < 5) {
        setPlayer2Picks([...player2Picks, character]);
        setCurrentPlayer(1);
      }
    }
  };

  // Check if character is banned or already picked
  const isCharacterDisabled = (character) => {
    return (
      bannedCharacters.player1?.name === character.name ||
      bannedCharacters.player2?.name === character.name ||
      player1Picks.some((pick) => pick.name === character.name) ||
      player2Picks.some((pick) => pick.name === character.name)
    );
  };

  if (loading) return <p>Loading characters...</p>;

  const createPlaceholders = (numPlaceholders, currentPicks) => {
    const placeholders = [];
    for (let i = 0; i < numPlaceholders - currentPicks.length; i++) {
      placeholders.push(<div key={i} className="placeholder">Empty Slot</div>);
    }
    return placeholders;
  };

  return (
    <div className="draft">
      <div className="draft-header">
        <h2>1v1 Draft</h2>
        <p>{banPhase ? 'Ban Phase' : `Player ${currentPlayer}'s turn to pick`}</p>
      </div>

      <div className="draft-container">
        {/* Left Panel - Player 1 Picks */}
        <div className="player-panel">
          <h3>Player 1 Picks</h3>
          <div className="picks">
            {player1Picks.map((pick, index) => (
              <div key={index} className="character-card">
                <img src={pick.imageUrl} alt={pick.name} />
                <h3>{pick.name}</h3>
              </div>
            ))}
            {createPlaceholders(5, player1Picks)}
          </div>

          <h3>Banned Character</h3>
          <div className="banned">
            {bannedCharacters.player1 ? (
              <div className="character-card disabled">
                <img src={bannedCharacters.player1.imageUrl} alt={bannedCharacters.player1.name} />
                <h3>{bannedCharacters.player1.name}</h3>
              </div>
            ) : (
              <div className="placeholder">No Ban</div>
            )}
          </div>
        </div>

        {/* Character Selection Grid */}
        <div className="characters">
          {allCharacters.map((character, index) => (
            <div
              key={index}
              className={`character-card ${isCharacterDisabled(character) ? 'disabled' : ''}`}
              onClick={() => !isCharacterDisabled(character) && handlePick(character)}
            >
              <img src={character.imageUrl} alt={character.name} />
              <h3>{character.name}</h3>
            </div>
          ))}
        </div>

        {/* Right Panel - Player 2 Picks */}
        <div className="player-panel">
          <h3>Player 2 Picks</h3>
          <div className="picks">
            {player2Picks.map((pick, index) => (
              <div key={index} className="character-card">
                <img src={pick.imageUrl} alt={pick.name} />
                <h3>{pick.name}</h3>
              </div>
            ))}
            {createPlaceholders(5, player2Picks)}
          </div>

          <h3>Banned Character</h3>
          <div className="banned">
            {bannedCharacters.player2 ? (
              <div className="character-card disabled">
                <img src={bannedCharacters.player2.imageUrl} alt={bannedCharacters.player2.name} />
                <h3>{bannedCharacters.player2.name}</h3>
              </div>
            ) : (
              <div className="placeholder">No Ban</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Draft;
