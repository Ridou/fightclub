import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const Match = () => {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);

  useEffect(() => {
    // Fetch match data (mock for now)
    const mockMatch = {
      matchId,
      player1: 'Player 1',
      player2: 'Player 2',
      result: 'Player 1 won',
    };
    setMatch(mockMatch);
  }, [matchId]);

  return match ? (
    <div className="match">
      <h2>Match ID: {match.matchId}</h2>
      <p>
        {match.player1} vs {match.player2}
      </p>
      <p>Result: {match.result}</p>
    </div>
  ) : (
    <p>Loading...</p>
  );
};

export default Match;
