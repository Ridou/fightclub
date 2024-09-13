import React, { useState, useEffect } from 'react';
import CharacterList from './CharacterList'; // Import CharacterList
import { saveUserTeam } from '../firebase'; // Firebase function to save team to Firestore
import '../styles/Draft.css'; // Ensure the styles are here

const Draft = ({ user }) => {
  const [player1Picks, setPlayer1Picks] = useState([]); // User's picks
  const [player2Picks, setPlayer2Picks] = useState([]);
  const [bannedCharacters, setBannedCharacters] = useState({ player1: null, player2: null });
  const [currentPlayer, setCurrentPlayer] = useState(1); // User is player1
  const [banPhase, setBanPhase] = useState(true);

  // Handle banning and picking characters
  const handlePick = (character) => {
    if (banPhase) {
      if (currentPlayer === 1 && !bannedCharacters.player1) {
        setBannedCharacters((prev) => ({ ...prev, player1: character }));
        setCurrentPlayer(2);
      } else if (currentPlayer === 2 && !bannedCharacters.player2) {
        setBannedCharacters((prev) => ({ ...prev, player2: character }));
        setCurrentPlayer(1);
        setBanPhase(false); // End ban phase
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
  const isCharacterBannedOrPicked = (character) => {
    return (
      bannedCharacters?.player1?.name === character.name ||
      bannedCharacters?.player2?.name === character.name ||
      player1Picks.some((pick) => pick.name === character.name) ||
      player2Picks.some((pick) => pick.name === character.name)
    );
  };

  // Save the user's team after picking
  const saveTeam = async () => {
    try {
      await saveUserTeam(user.uid, player1Picks); // Save user’s picks as their team
      alert('Team saved successfully!');
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Failed to save the team.');
    }
  };

  useEffect(() => {
    // Automatically save team when draft is completed
    if (player1Picks.length === 5) {
      saveTeam();
    }
  }, [player1Picks]);

  return (
    <div className="draft">
      <div className="draft-header">
        <h2>1v1 Draft</h2>
        <p>{banPhase ? 'Ban Phase' : `Player ${currentPlayer}'s turn to pick`}</p>
      </div>

      <div className="draft-container">
        {/* Left Panel - Player 1 Picks */}
        <div className="player-panel">
          <h3>Your Picks</h3>
          <div className="picks">
            {player1Picks.map((pick, index) => (
              <div key={index} className={`character-card ${pick.rarity}`}>
                <img src={pick.imageUrl} alt={pick.name} />
                <h3>{pick.name}</h3>
              </div>
            ))}
          </div>
          <h3>Your Banned Character</h3>
          <div className="banned">
            {bannedCharacters.player1 ? (
              <div className={`character-card ${bannedCharacters.player1.rarity}`}>
                <img src={bannedCharacters.player1.imageUrl} alt={bannedCharacters.player1.name} />
                <h3>{bannedCharacters.player1.name}</h3>
              </div>
            ) : (
              <div className="placeholder">No Ban</div>
            )}
          </div>
        </div>

        {/* Character Selection Grid */}
        <CharacterList
          onSelect={(character) => !isCharacterBannedOrPicked(character) && handlePick(character)}
        />

        {/* Right Panel - Player 2 Picks */}
        <div className="player-panel">
          <h3>Player 2 Picks</h3>
          <div className="picks">
            {player2Picks.map((pick, index) => (
              <div key={index} className={`character-card ${pick.rarity}`}>
                <img src={pick.imageUrl} alt={pick.name} />
                <h3>{pick.name}</h3>
              </div>
            ))}
          </div>
          <h3>Player 2 Banned Character</h3>
          <div className="banned">
            {bannedCharacters.player2 ? (
              <div className={`character-card ${bannedCharacters.player2.rarity}`}>
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
