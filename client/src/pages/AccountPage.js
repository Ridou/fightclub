import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const AccountPage = ({ user }) => {
  const [activeMatches, setActiveMatches] = useState([]);

  useEffect(() => {
    const fetchActiveMatches = async () => {
      try {
        const userDocRef = doc(getFirestore(), `users/${user.uid}`);
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          setActiveMatches(userData.activeMatches || []);
        }
      } catch (error) {
        console.error('Error fetching active matches:', error);
      }
    };

    if (user) {
      fetchActiveMatches();
    }
  }, [user]);

  return (
    <div>
      <h2>Welcome, {user.displayName}</h2>
      <h3>Active Matches</h3>
      {activeMatches.length > 0 ? (
        <ul>
          {activeMatches.map((matchId, index) => (
            <li key={index}>
              <Link to={`/match/${matchId}`}>Match ID: {matchId}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No active matches</p>
      )}
    </div>
  );
};

export default AccountPage;
