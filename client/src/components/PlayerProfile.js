import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const PlayerProfile = () => {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    // Fetch player data based on ID (mock for now)
    const mockPlayer = {
      id,
      playerName: `Player ${id}`,
      points: 100,
      matchHistory: [
        { matchId: 1, result: 'Win', opponent: 'Player 2' },
        { matchId: 2, result: 'Loss', opponent: 'Player 3' },
      ],
    };
    setPlayer(mockPlayer);
  }, [id]);

  return player ? (
    <div className="player-profile">
      <h2>{player.playerName}'s Profile</h2>
      <p>Points: {player.points}</p>
      <h3>Match History</h3>
      <ul>
        {player.matchHistory.map((match, index) => (
          <li key={index}>
            Match ID: {match.matchId}, Result: {match.result}, Opponent: {match.opponent}
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <p>Loading...</p>
  );
};

export default PlayerProfile;
