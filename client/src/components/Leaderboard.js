import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => doc.data());

        usersList.sort((a, b) => {
          const winLossRatioA = (a.wins?.length || 0) / ((a.losses?.length || 0) + 1);
          const winLossRatioB = (b.wins?.length || 0) / ((b.losses?.length || 0) + 1);
          return winLossRatioB - winLossRatioA;
        });

        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h2>Leaderboard</h2>
      <ul>
        {users.map((user, index) => (
          <li key={index}>
            {user.inGameName}: {user.wins?.length || 0} Wins, {user.losses?.length || 0} Losses
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;