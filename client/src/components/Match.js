import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const Match = () => {
  const { matchId } = useParams(); // To retrieve matchId from URL parameters
  const [match, setMatch] = useState(null);
  const [queueCount, setQueueCount] = useState(0);
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    // Mock fetching match data
    const mockMatch = {
      matchId,
      player1: 'Player 1',
      player2: waiting ? 'Waiting...' : 'Player 2', // Simulate waiting for another player
      result: waiting ? 'In progress' : 'Player 1 won', // Mock result
    };
    setMatch(mockMatch);

    // Simulate queue and matchmaking process
    const interval = setInterval(() => {
      setQueueCount(queueCount + 1);
      if (queueCount >= 1) {
        setWaiting(false); // Once a player is found
        clearInterval(interval); // Stop looking for players
      }
    }, 3000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [matchId, queueCount]);

  const handleJoinQueue = () => {
    setQueueCount(queueCount + 1); // Mock joining the queue
  };

  return match ? (
    <div className="match">
      <h2>Match ID: {match.matchId}</h2>
      <p>
        {match.player1} vs {match.player2}
      </p>
      <p>Result: {match.result}</p>
      {waiting ? (
        <div>
          <p>Players in queue: {queueCount}</p>
          <button onClick={handleJoinQueue}>Fight Now</button>
        </div>
      ) : (
        <p>Match started!</p>
      )}
    </div>
  ) : (
    <p>Loading...</p>
  );
};

export default Match;
