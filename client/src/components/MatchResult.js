import React, { useEffect } from 'react';
import { db, rtdb } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, update } from 'firebase/database';

const MatchResult = ({ matchId, winnerUid, loserUid }) => {
  useEffect(() => {
    const updateMatchHistory = async () => {
      try {
        const matchRef = ref(rtdb, `matches/${matchId}`);
        await update(matchRef, { status: 'completed', endTime: Date.now() });

        const winnerRef = doc(db, `users/${winnerUid}`);
        const loserRef = doc(db, `users/${loserUid}`);

        await updateDoc(winnerRef, {
          matchHistory: arrayUnion({ matchId, result: 'win' }),
          wins: arrayUnion(matchId),
        });

        await updateDoc(loserRef, {
          matchHistory: arrayUnion({ matchId, result: 'loss' }),
          losses: arrayUnion(matchId),
        });
      } catch (error) {
        console.error('Error updating match history:', error);
      }
    };

    updateMatchHistory();
  }, [matchId, winnerUid, loserUid]);

  return <div>Match Result Updated</div>;
};

export default MatchResult;