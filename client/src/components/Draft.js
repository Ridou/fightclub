import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";
import '../styles/Draft.css';
import CharacterCard from './CharacterCard'; // Import the character card component

const socket = io('http://localhost:5000');

const Draft = ({ user }) => {
  const location = useLocation();
  const { player1, player2 } = location.state;

  const [player1Team, setPlayer1Team] = useState([]);
  const [player2Team, setPlayer2Team] = useState([]);
  const [player1Deployed, setPlayer1Deployed] = useState([]);
  const [player2Deployed, setPlayer2Deployed] = useState([]);
  const [bannedCharacters, setBannedCharacters] = useState({ player1: [], player2: [] }); // Set default as empty arrays
  const [currentTurn, setCurrentTurn] = useState(1);
  const [banPhase, setBanPhase] = useState(true);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [timer, setTimer] = useState(60);

  const maxDeployed = 5;

  const draftRoomId = `${player1.uid}-${player2.uid}`;

  // Fetch Teams from Firestore
  const fetchTeams = async () => {
    try {
      const player1DocRef = doc(db, 'users', player1.uid);
      const player2DocRef = doc(db, 'users', player2.uid);
  
      const player1TeamDoc = await getDoc(player1DocRef);
      const player2TeamDoc = await getDoc(player2DocRef);
  
      if (player1TeamDoc.exists() && player2TeamDoc.exists()) {
        const player1Data = player1TeamDoc.data();
        const player2Data = player2TeamDoc.data();
  
        setPlayer1Team(player1Data.team);
        setPlayer2Team(player2Data.team);
  
        // Always set the correct in-game names from Firestore
        if (!player1.inGameName || player1.inGameName !== player1Data.inGameName) {
          player1.inGameName = player1Data.inGameName;
        }
        if (!player2.inGameName || player2.inGameName !== player2Data.inGameName) {
          player2.inGameName = player2Data.inGameName;
        }
  
        console.log('Player 1 In-Game Name:', player1.inGameName);
        console.log('Player 2 In-Game Name:', player2.inGameName);
  
      } else {
        console.error('Error: One or both teams do not exist in Firestore.');
      }
    } catch (error) {
      console.error('Error fetching teams from Firebase:', error);
    }
  };
  

  useEffect(() => {
    fetchTeams();

    socket.emit('joinRoom', { draftRoomId, userId: user.uid });

    socket.on('updateDraft', (data) => {
      setPlayer1Deployed(data.player1Deployed || []);
      setPlayer2Deployed(data.player2Deployed || []);
      setBannedCharacters(data.bannedCharacters || { player1: [], player2: [] });
      setCurrentTurn(data.currentTurn);
      setBanPhase(data.banPhase);
      setTimer(60);

      const isPlayerTurnNow = (data.players.player1 === user.uid && data.currentTurn === 1) || 
                              (data.players.player2 === user.uid && data.currentTurn === 2);
      setIsPlayerTurn(isPlayerTurnNow);
    });

    const timerInterval = setInterval(() => {
      if (timer > 0) {
        setTimer((prevTimer) => prevTimer - 1);
      }
    }, 1000);

    return () => {
      socket.emit('leaveRoom', { draftRoomId, userId: user.uid });
      socket.off('updateDraft');
      clearInterval(timerInterval);
    };
  }, [draftRoomId, user, timer]);

  const handlePickOrBan = (character) => {
    if (!isPlayerTurn) {
      console.log('Not your turn!');  // Prevents non-active player from clicking
      return;
    }
  
    if (banPhase) {
      // Handle ban phase logic: Ban a character for the current player
      socket.emit('makeMove', {
        draftRoomId,
        userId: user.uid,
        character,
        phase: 'ban',
        player1,
        player2,
      });
    } else {
      // Handle pick phase logic: Add a character to the deployable team
      if (currentTurn === 1) {
        if (player1Deployed.length < maxDeployed) {
          setPlayer1Deployed([...player1Deployed, character]); // Add character to deployable team
        }
      } else if (currentTurn === 2) {
        if (player2Deployed.length < maxDeployed) {
          setPlayer2Deployed([...player2Deployed, character]); // Add character to deployable team
        }
      }
  
      // Emit pick move to server
      socket.emit('makeMove', {
        draftRoomId,
        userId: user.uid,
        character,
        phase: 'pick',
        player1,
        player2,
      });
    }
  };

  const renderDeployed = (deployedTeam) => {
    const deployedSlots = [...deployedTeam];
    while (deployedSlots.length < maxDeployed) {
      deployedSlots.push({ name: 'Empty Slot', rarity: 'common', imageUrl: '' }); // Add placeholders without image
    }
    return deployedSlots.map((character, index) => (
      <CharacterCard 
        key={index} 
        character={character} 
        isBanned={false} 
        onClick={null} 
      />
    ));
  };

  return (
    <div className="draft">
      <div className="draft-header">
        <h2>Draft Room</h2>
      </div>

      <div className="draft-container">
        
        {/* Player 1 Team and Deploy Panel */}
        <div className="team-panel">
          <h3>{player1.inGameName || 'Player 1'}</h3> {/* Ensure inGameName is shown */}
          <div className="team-grid">
            {player1Team.map((character, index) => (
              <CharacterCard
                key={index}
                character={character}
                isBanned={Array.isArray(bannedCharacters.player1) && bannedCharacters.player1.includes(character.name)}
                onClick={() => handlePickOrBan(character)}
              />
            ))}
          </div>
        </div>

        {/* Deployable Team Panel */}
        <div className="deployed-panel">
          <h3>Deployable Team</h3>
          {renderDeployed(player1Deployed)}
        </div>

        {/* Middle Panel */}
        <div className="middle-panel">
          <h3>{banPhase ? 'Ban Phase' : 'Pick Phase'}</h3>
          <h4>Current Turn: {currentTurn === 1 ? player1.inGameName : player2.inGameName}</h4>
          <p className="turn-indicator">{isPlayerTurn ? 'Your Turn' : "Opponent's Turn"}</p>
          <p className="timer">Time Left: {timer}s</p>
          <img src="https://firebasestorage.googleapis.com/v0/b/socfightclub.appspot.com/o/maps%2Fimage_2024-09-16_004427236.png?alt=media&token=d82fe782-a30e-412e-86ea-31de678c96ca" alt="Map" className="map" />
        </div>

        {/* Player 2 Deployable and Team Panels */}
        <div className="deployed-panel">
          <h3>Deployable Team</h3>
          {renderDeployed(player2Deployed)}
        </div>
        
        <div className="team-panel">
          <h3>{player2.inGameName || 'Player 2'}</h3> {/* Ensure inGameName is shown */}
          <div className="team-grid">
            {player2Team.map((character, index) => (
              <CharacterCard
                key={index}
                character={character}
                isBanned={Array.isArray(bannedCharacters.player2) && bannedCharacters.player2.includes(character.name)}
                onClick={() => handlePickOrBan(character)}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Draft;
