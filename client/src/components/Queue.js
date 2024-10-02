import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const Queue = () => {
  const [inQueue, setInQueue] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [matchId, setMatchId] = useState(null);

  const db = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;

  // Join the queue
  const joinQueue = async () => {
    setWaiting(true);
    try {
      await addDoc(collection(db, 'queue'), {
        uid: user.uid,
        email: user.email,
        joinedAt: new Date()
      });
      setInQueue(true);
    } catch (error) {
      console.error("Error joining queue:", error);
    }
  };

  // Listen for queue updates
  useEffect(() => {
    const q = collection(db, 'queue');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQueueSize(snapshot.size);

      if (snapshot.size >= 2) {
        const [player1, player2] = snapshot.docs.map(doc => doc.data());
        createMatch(player1, player2);
      }
    });

    return () => unsubscribe();
  }, [db]);

  const createMatch = async (player1, player2) => {
    try {
      const matchDoc = await addDoc(collection(db, 'matches'), {
        player1Name: player1.email,
        player2Name: player2.email,
        result: null,
        startedAt: new Date()
      });

      setMatchId(matchDoc.id);

      // Remove players from the queue after match creation
      await updateDoc(doc(db, 'queue', player1.uid), { matched: true });
      await updateDoc(doc(db, 'queue', player2.uid), { matched: true });

      setWaiting(false); // End waiting
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  return (
    <div>
      <h2>Queue</h2>
      <p>Queue Size: {queueSize}</p>
      {waiting ? (
        <p>Waiting for an opponent...</p>
      ) : (
        <button onClick={joinQueue}>Join Queue</button>
      )}
      {matchId && <p>Match ID: {matchId}</p>}
    </div>
  );
};

export default Queue;
