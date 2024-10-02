import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import '../styles/MatchDetails.css'; // Import the new CSS file

const MatchDetails = () => {
  const { matchId } = useParams();
  const [matchDetails, setMatchDetails] = useState(null);
  const [mapImageUrl, setMapImageUrl] = useState('');

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

  useEffect(() => {
    if (matchDetails) {
      const fetchMapImage = async () => {
        try {
          const storage = getStorage();
          const mapRef = ref(storage, `maps/${matchDetails.map.toLowerCase().replace(' ', '')}.png`);
          const url = await getDownloadURL(mapRef);
          setMapImageUrl(url);
        } catch (error) {
          console.error('Error fetching map image:', error);
        }
      };

      fetchMapImage();
    }
  }, [matchDetails]);

  if (!matchDetails) {
    return <p>Loading match details...</p>;
  }

  return (
    <div className="match-details-page">
      <div className="match-details-container">
        <div className="team-panel">
          <h3>Player 1</h3>
          <p>In-Game Name: {matchDetails.player1.inGameName}</p>
          <p>UID: {matchDetails.player1.uid}</p>
        </div>

        <div className="middle-panel">
          <h2>Match Details</h2>
          <p>Match ID: {matchId}</p>
          <p>Date: {new Date(matchDetails.createdAt).toLocaleString()}</p>
          <p>Status: {matchDetails.status}</p>
          <p>Mode: {matchDetails.mode}</p>
          <p>Map: {matchDetails.map}</p>
          {mapImageUrl && <img src={mapImageUrl} alt={matchDetails.map} className="map-image" />}
          <Link to={`/report/${matchId}`} className="report-button">Report Match</Link>
        </div>

        <div className="team-panel">
          <h3>Player 2</h3>
          <p>In-Game Name: {matchDetails.player2.inGameName}</p>
          <p>UID: {matchDetails.player2.uid}</p>
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;