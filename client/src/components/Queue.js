import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
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
    const q = query(collection(db, 'queue'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setQueueSize(querySnapshot.size);

      // If there are two players, create a match
      if (querySnapshot.size >= 2) {
        const players = querySnapshot.docs.map(doc => doc.data());
        const [player1, player2] = players;

        // Create match document
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

  if (waiting) return <p>Waiting for a match...</p>;

  return (
    <div className="queue">
      <h2>Join Queue</h2>
      <p>Current players in queue: {queueSize}</p>
      {matchId ? (
        <p>Match found! <a href={`/match/${matchId}`}>Go to match</a></p>
      ) : (
        <button onClick={joinQueue} disabled={inQueue}>Join Queue</button>
      )}
    </div>
  );
};

export default Queue;
