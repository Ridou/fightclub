// client/src/components/Draft.js
import React, { useState } from 'react';

const Draft = () => {
  const allCharacters = ['Gloria', 'Simona', 'Abyss', 'Acambe'];

  const [player1Picks, setPlayer1Picks] = useState([]);
  const [player2Picks, setPlayer2Picks] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(1);

  const handlePick = (character) => {
    if (currentPlayer === 1) {
      setPlayer1Picks([...player1Picks, character]);
      setCurrentPlayer(2);
    } else {
      setPlayer2Picks([...player2Picks, character]);
      setCurrentPlayer(1);
    }
  };

  return (
    <div className="draft">
      <h2>1v1 Draft</h2>
      <div className="picks">
        <div>
          <h3>Player 1 Picks</h3>
          {player1Picks.map((pick, index) => (
            <div key={index}>{pick}</div>
          ))}
        </div>
        <div>
          <h3>Player 2 Picks</h3>
          {player2Picks.map((pick, index) => (
            <div key={index}>{pick}</div>
          ))}
        </div>
      </div>

      <h3>Available Characters</h3>
      <div className="characters">
        {allCharacters.map((character, index) => (
          <button
            key={index}
            onClick={() => handlePick(character)}
            disabled={player1Picks.includes(character) || player2Picks.includes(character)}
          >
            {character}
          </button>
        ))}
      </div>
      <p>Current Turn: Player {currentPlayer}</p>
    </div>
  );
};

export default Draft;
