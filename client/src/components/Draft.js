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
  const { player1, player2, draftRoomId } = location.state; // Pre-assigned player roles

  const [player1Team, setPlayer1Team] = useState([]);
  const [player2Team, setPlayer2Team] = useState([]);
  const [player1Deployed, setPlayer1Deployed] = useState([]);
  const [player2Deployed, setPlayer2Deployed] = useState([]);
  const [bannedCharacters, setBannedCharacters] = useState({ player1: [], player2: [] });
  const [currentTurn, setCurrentTurn] = useState(1);
  const [banPhase, setBanPhase] = useState(true);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [timer, setTimer] = useState(60);

  const maxDeployed = 5;

  // Fetch teams from Firebase
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

        console.log('Player 1:', player1);
        console.log('Player 2:', player2);
      } else {
        console.error('Error: One or both teams do not exist in Firestore.');
      }
    } catch (error) {
      console.error('Error fetching teams from Firebase:', error);
    }
  };

  // Listen for server updates and determine turn
  useEffect(() => {
    fetchTeams();

    // Join the room with the assigned player1 and player2 roles
    socket.emit('joinRoom', { draftRoomId, userId: user.uid, player1, player2 });

    // Receive updates from the server
    socket.on('updateDraft', (data) => {
      console.log('Received updateDraft:', data);

      // Update deployed characters and banned characters
      setPlayer1Deployed(data.player1Deployed || []);
      setPlayer2Deployed(data.player2Deployed || []);
      setBannedCharacters(data.bannedCharacters || { player1: [], player2: [] });
      setCurrentTurn(data.currentTurn);
      setBanPhase(data.banPhase);
      setTimer(60); // Reset timer every time a move is made

      // Ensure the correct player is allowed to take a turn
      const isPlayer1 = data.players.player1 === user.uid;
      const isPlayer2 = data.players.player2 === user.uid;

      // Compare the currentTurn with the player's uid
      const isPlayerTurnNow = (isPlayer1 && data.currentTurn === 1) || (isPlayer2 && data.currentTurn === 2);
      setIsPlayerTurn(isPlayerTurnNow);

      console.log('Is it player turn:', isPlayerTurnNow, 'Current turn:', data.currentTurn);
    });

    const timerInterval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer > 0) return prevTimer - 1;
        return 0;
      });
    }, 1000);

    return () => {
      socket.emit('leaveRoom', { draftRoomId, userId: user.uid });
      socket.off('updateDraft');
      clearInterval(timerInterval);
    };
  }, [draftRoomId, user]);

  // Handle pick or ban action
  const handlePickOrBan = (character) => {
    if (!isPlayerTurn) {
      console.log('Not your turn');
      return;
    }

    // Emit move to server
    socket.emit('makeMove', {
      draftRoomId,
      userId: user.uid,
      character,
      phase: banPhase ? 'ban' : 'pick',
    });
    console.log('Move made:', character);
  };

  // Render deployed characters
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
          <h3>{player1.inGameName || 'Player 1'}</h3>
          <div className="team-grid">
            {player1Team.map((character, index) => (
              <CharacterCard
                key={index}
                character={character}
                isBanned={bannedCharacters.player1.includes(character.name)} // Disable banned characters
                onClick={() => handlePickOrBan(character)}
                disabled={!isPlayerTurn || bannedCharacters.player1.includes(character.name)} // Disable if not player's turn or banned
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
          <h3>{player2.inGameName || 'Player 2'}</h3>
          <div className="team-grid">
            {player2Team.map((character, index) => (
              <CharacterCard
                key={index}
                character={character}
                isBanned={bannedCharacters.player2.includes(character.name)} // Disable banned characters
                onClick={() => handlePickOrBan(character)}
                disabled={!isPlayerTurn || bannedCharacters.player2.includes(character.name)} // Disable if not player's turn or banned
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Draft;
