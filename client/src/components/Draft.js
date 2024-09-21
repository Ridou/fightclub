import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { rtdb } from '../firebase'; // Realtime Database
import { ref, onValue, update } from "firebase/database"; // Realtime Database methods
import { getUserProfile } from '../firebase'; // Import Firestore functions
import CharacterCard from './CharacterCard';
import '../styles/Draft.css';

const Draft = ({ user }) => {
  const location = useLocation();
  const { player1, player2, draftRoomId } = location.state;

  const [player1Deployed, setPlayer1Deployed] = useState([]);
  const [player2Deployed, setPlayer2Deployed] = useState([]);
  const [bannedCharacters, setBannedCharacters] = useState({ player1: [], player2: [] });
  const [currentTurn, setCurrentTurn] = useState(1);
  const [banPhase, setBanPhase] = useState(true);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [timer, setTimer] = useState(60);

  const maxDeployed = 5;

  // Fetch team data from Firestore
  const fetchTeam = async (uid) => {
    return await getUserProfile(uid);
  };

  // Use TanStack Query to fetch teams
  const { data: player1Data, isLoading: isLoadingP1, error: errorP1 } = useQuery({
    queryKey: ['team', player1.uid],
    queryFn: () => fetchTeam(player1.uid)
  });

  const { data: player2Data, isLoading: isLoadingP2, error: errorP2 } = useQuery({
    queryKey: ['team', player2.uid],
    queryFn: () => fetchTeam(player2.uid)
  });

  // Handle Realtime Database for real-time synchronization
useEffect(() => {
  const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}`);

  // Check that we are correctly connected to Firebase
  console.log('Listening to Firebase Realtime Database for draft room:', draftRoomId);

  onValue(draftRoomRef, (snapshot) => {
    const data = snapshot.val();
    console.log('Received real-time data:', data);
  
    if (data) {
      // Process data if it exists
      setPlayer1Deployed(data.player1Deployed || []);
      setPlayer2Deployed(data.player2Deployed || []);
      setBannedCharacters(data.bannedCharacters || { player1: [], player2: [] });
      setCurrentTurn(data.currentTurn);
      setBanPhase(data.banPhase);
      setTimer(60); // Reset timer on update
    } else {
      // Log or handle when no data is found
      console.log('No data found for this draft room.');
    }
  });

  return () => {
    console.log('Cleaning up real-time listener');
  };
}, [draftRoomId]);

  // Handle ban or pick action
  const handlePickOrBan = (character) => {
    if (!isPlayerTurn) {
      console.log('It\'s not your turn yet.');
      return;
    }
  
    console.log('Character selected for pick/ban:', character);
    console.log('Current phase (banPhase):', banPhase ? 'Ban Phase' : 'Pick Phase');
    console.log('Current turn (Player 1 or Player 2):', currentTurn);
  
    const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}`);
    
    update(draftRoomRef, {
      [`bannedCharacters.player${currentTurn}`]: [
        ...bannedCharacters[`player${currentTurn}`], 
        character
      ],
      currentTurn: currentTurn === 1 ? 2 : 1, // Switch turns
      banPhase: !banPhase, // Toggle the ban phase
    }).then(() => {
      console.log('Pick/Ban action updated in the database');
    }).catch((error) => {
      console.error('Error updating the pick/ban:', error);
    });
  };
  

  const renderDeployed = (deployedTeam) => {
    const deployedSlots = [...deployedTeam];
    while (deployedSlots.length < maxDeployed) {
      deployedSlots.push({ name: 'Empty Slot', rarity: 'common', imageUrl: '' });
    }
    return deployedSlots.map((character, index) => (
      <CharacterCard key={index} character={character} isBanned={false} onClick={null} />
    ));
  };

  if (isLoadingP1 || isLoadingP2) return <p>Loading teams...</p>;
  if (errorP1 || errorP2) return <p>Error loading teams.</p>;

  return (
    <div className="draft">
      <div className="draft-header">
        <h2>Draft Room</h2>
      </div>

      <div className="draft-container">
        <div className="team-panel">
          <h3>{player1Data?.inGameName || 'Player 1'}</h3>
          <div className="team-grid">
            {player1Data?.team.map((character, index) => (
              <CharacterCard
                key={index}
                character={character}
                isBanned={bannedCharacters.player1.includes(character.name) || bannedCharacters.player2.includes(character.name)}
                onClick={() => handlePickOrBan(character)}
                disabled={!isPlayerTurn || bannedCharacters.player1.includes(character.name) || bannedCharacters.player2.includes(character.name)}
              />
            ))}
          </div>
        </div>

        <div className="deployed-panel">
          <h3>Deployable Team</h3>
          {renderDeployed(player1Deployed)}
        </div>

        <div className="middle-panel">
          <h3>{banPhase ? 'Ban Phase' : 'Pick Phase'}</h3>
          <h4>Current Turn: {currentTurn === 1 ? player1Data?.inGameName : player2Data?.inGameName}</h4>
          <p className="turn-indicator">{isPlayerTurn ? 'Your Turn' : "Opponent's Turn"}</p>
          <p className="timer">Time Left: {timer}s</p>
        </div>

        <div className="deployed-panel">
          <h3>Deployable Team</h3>
          {renderDeployed(player2Deployed)}
        </div>

        <div className="team-panel">
          <h3>{player2Data?.inGameName || 'Player 2'}</h3>
          <div className="team-grid">
            {player2Data?.team.map((character, index) => (
              <CharacterCard
                key={index}
                character={character}
                isBanned={bannedCharacters.player1.includes(character.name) || bannedCharacters.player2.includes(character.name)}
                onClick={() => handlePickOrBan(character)}
                disabled={!isPlayerTurn || bannedCharacters.player1.includes(character.name) || bannedCharacters.player2.includes(character.name)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Draft;
