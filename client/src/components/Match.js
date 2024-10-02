import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, onSnapshot, limit, arrayUnion } from 'firebase/firestore';
import ModeMapSelection from './ModeMapSelection';

const Match = ({ user }) => {
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState(null);
  const [selection, setSelection] = useState(null);

  const fetchInGameName = async (uid) => {
    try {
      const userDocRef = doc(db, `users/${uid}`);
      const userDocSnapshot = await getDoc(userDocRef);
      if (userDocSnapshot.exists() && userDocSnapshot.data().inGameName) {
        return userDocSnapshot.data().inGameName;
      } else {
        return 'Player';
      }
    } catch (error) {
      console.error('Error fetching in-game name:', error);
      return 'Player';
    }
  };

  const createOrJoinMatch = async (opponent) => {
    try {
      const player1InGameName = await fetchInGameName(user.uid);
      const player2InGameName = await fetchInGameName(opponent.uid);

      if (!player1InGameName || !player2InGameName) {
        throw new Error('In-game name is undefined');
      }

      const matchId = `${user.uid}_${opponent.uid}`;
      const matchRef = doc(db, `matches/${matchId}`);

      const matchDoc = await getDoc(matchRef);
      if (matchDoc.exists()) {
        return matchId;
      } else {
        await setDoc(matchRef, {
          player1: { uid: user.uid, inGameName: player1InGameName },
          player2: { uid: opponent.uid, inGameName: player2InGameName },
          status: 'active',
          createdAt: Date.now(),
          mode: selection.mode, // Use the selected mode
          map: selection.map // Use the selected map
        });

        const userRef = doc(db, `users/${user.uid}`);
        const opponentRef = doc(db, `users/${opponent.uid}`);
        await setDoc(userRef, { activeMatches: arrayUnion(matchId) }, { merge: true });
        await setDoc(opponentRef, { activeMatches: arrayUnion(matchId) }, { merge: true });

        return matchId;
      }
    } catch (error) {
      console.error('Error creating or joining match:', error);
      return null;
    }
  };

  const handleMatchmaking = async () => {
    try {
      const q = query(
        collection(db, 'queue'),
        where('uid', '!=', user.uid),
        where('mode', '==', selection.mode),
        where('map', '==', selection.map),
        limit(1)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (snapshot.size > 0) {
          const opponentDoc = snapshot.docs[0];
          const opponent = opponentDoc.data();

          const matchId = await createOrJoinMatch(opponent);

          if (matchId) {
            setMatchId(matchId);

            await deleteDoc(doc(db, `queue/${user.uid}`));
            await deleteDoc(doc(db, `queue/${opponent.uid}`));

            navigate('/account');
          }
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error handling matchmaking:', error);
    }
  };

  useEffect(() => {
    if (user && selection) {
      const joinQueue = async () => {
        try {
          const queueRef = doc(db, `queue/${user.uid}`);
          await setDoc(queueRef, {
            uid: user.uid,
            inGameName: user.inGameName || 'Player',
            mode: selection.mode,
            map: selection.map,
          });

          handleMatchmaking();
        } catch (error) {
          console.error('Error joining queue:', error);
        }
      };

      joinQueue();
    }
  }, [user, selection]);

  const handleSelection = (selection) => {
    setSelection(selection);
  };

  return (
    <div>
      {!selection ? (
        <ModeMapSelection onSelection={handleSelection} />
      ) : (
        <div>
          <h2>Waiting for an opponent...</h2>
          {matchId && <p>Match ID: {matchId}</p>}
        </div>
      )}
    </div>
  );
};

export default Match;