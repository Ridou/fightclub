import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import '../styles/ReportMatch.css';

const ReportMatch = ({ user }) => {
  const { matchId } = useParams();
  const [report, setReport] = useState('');
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [matchDetails, setMatchDetails] = useState(null);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        const matchDocRef = doc(db, `matches/${matchId}`);
        const matchDocSnapshot = await getDoc(matchDocRef);
        if (matchDocSnapshot.exists()) {
          setMatchDetails(matchDocSnapshot.data());
        } else {
          console.error('Match not found');
        }
      } catch (error) {
        console.error('Error fetching match details:', error);
      }
    };

    fetchMatchDetails();
  }, [matchId]);

  const handleReport = async (result) => {
    try {
      const matchRef = doc(db, `matches/${matchId}`);
      await updateDoc(matchRef, {
        [`reports.${user.uid}`]: result,
        [`reports.${user.uid}_time`]: Date.now(),
      });
      setReport(result);
      setShowPopup(false);
    } catch (error) {
      console.error('Error reporting match result:', error);
      setError('Failed to report match result.');
    }
  };

  const checkMatchResult = async () => {
    try {
      const matchRef = doc(db, `matches/${matchId}`);
      const matchDoc = await getDoc(matchRef);
      if (matchDoc.exists()) {
        const matchData = matchDoc.data();
        const reports = matchData.reports || {};
        const player1Report = reports[matchDetails.player1.uid];
        const player2Report = reports[matchDetails.player2.uid];

        if (player1Report && player2Report) {
          if (player1Report === player2Report) {
            const winnerUid = player1Report === 'win' ? matchDetails.player1.uid : matchDetails.player2.uid;
            const loserUid = player1Report === 'win' ? matchDetails.player2.uid : matchDetails.player1.uid;
            await updateDoc(matchRef, { winner: winnerUid, status: 'completed' });
            // Update win/loss count for players
            const winnerRef = doc(db, `users/${winnerUid}`);
            const loserRef = doc(db, `users/${loserUid}`);
            await updateDoc(winnerRef, { wins: arrayUnion(matchId) });
            await updateDoc(loserRef, { losses: arrayUnion(matchId) });
          } else {
            setError('Reports do not match. Please contact support.');
          }
        }
      }
    } catch (error) {
      console.error('Error checking match result:', error);
    }
  };

  useEffect(() => {
    if (report) {
      checkMatchResult();
    }
  }, [report]);

  return (
    <div>
      <h2>Report Match Result</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => setShowPopup(true)}>Report Match</button>
      {showPopup && (
        <div className="popup">
          <h3>Who won the match?</h3>
          <button onClick={() => handleReport('win')}>I won</button>
          <button onClick={() => handleReport('loss')}>I lost</button>
          <button onClick={() => setShowPopup(false)}>Cancel</button>
        </div>
      )}
      {report && <p>You reported a {report}.</p>}
    </div>
  );
};

export default ReportMatch;