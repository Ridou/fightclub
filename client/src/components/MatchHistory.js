// src/components/MatchHistory.js
import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import '../styles/MatchHistory.css'; // Match history styles

const db = getFirestore();

function MatchHistory({ user }) {
  const [matchHistory, setMatchHistory] = useState([]);

  // Fetch match history from Firestore
  useEffect(() => {
    const fetchMatchHistory = async () => {
      const matchSnapshot = await getDocs(collection(db, `users/${user.uid}/matches`));
      const matches = matchSnapshot.docs.map((doc) => doc.data());
      setMatchHistory(matches);
    };

    fetchMatchHistory();
  }, [user]);

  return (
    <div className="match-history">
      <h3>Match History</h3>
      {matchHistory.length > 0 ? (
        <ul>
          {matchHistory.map((match, index) => (
            <li key={index}>
              <p>Match ID: {match.id}</p>
              <p>Result: {match.result}</p>
              <p>Date: {new Date(match.date.seconds * 1000).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No match history available.</p>
      )}
    </div>
  );
}

export default MatchHistory;
