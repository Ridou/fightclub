import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import '../styles/Ladder.css';

function Ladder() {
  const [gameData, setGameData] = useState({
    name: 'Sword of Convallaria',
    entry: 'XP',
    teamSize: '2v2',
    skillLevel: 'All Skills',
    support: 'Tickets',
    starting: 'Available Now'
  });
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const db = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;

  // Check if the user has already joined the ladder
  useEffect(() => {
    const checkLadderParticipation = async () => {
      setLoading(true);
      const q = query(collection(db, 'ladderParticipants'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      setHasJoined(!querySnapshot.empty);
      setLoading(false);
    };

    if (user) {
      checkLadderParticipation();
    }
  }, [user, db]);

  // Handle joining the ladder
  const handleJoinLadder = async () => {
    if (!hasJoined) {
      try {
        await addDoc(collection(db, 'ladderParticipants'), {
          uid: user.uid,
          email: user.email, // Storing user email as an example
          joinedAt: new Date()
        });
        setHasJoined(true); // Update state to reflect that the user has joined
      } catch (error) {
        console.error('Error joining ladder:', error);
      }
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="ladder-container">
      <h2>Ladder</h2>
      <table className="ladder-table">
        <thead>
          <tr>
            <th>Game</th>
            <th>Entry</th>
            <th>Team Size</th>
            <th>Skill Level</th>
            <th>Support</th>
            <th>Starting</th>
            <th>Info</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{gameData.name}</td>
            <td>{gameData.entry}</td>
            <td>{gameData.teamSize}</td>
            <td>{gameData.skillLevel}</td>
            <td>{gameData.support}</td>
            <td>{gameData.starting}</td>
            <td>
              {hasJoined ? (
                <button className="joined-button" disabled>Already Joined</button>
              ) : (
                <button className="accept-button" onClick={handleJoinLadder}>Join</button>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Ladder;
