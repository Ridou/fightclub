import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import CharacterList from './CharacterList';
import '../styles/Draft.css';

// Connect to the WebSocket server
const socket = io('http://localhost:5000'); // Adjust the URL based on where your server is hosted

const Draft = ({ user }) => {
  const location = useLocation();
  const { player1, player2 } = location.state;

  const [player1Picks, setPlayer1Picks] = useState([]);
  const [player2Picks, setPlayer2Picks] = useState([]);
  const [bannedCharacters, setBannedCharacters] = useState({ player1: null, player2: null });
  const [currentTurn, setCurrentTurn] = useState(1);
  const [banPhase, setBanPhase] = useState(true);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);

  const draftRoomId = `${player1.uid}-${player2.uid}`;

  useEffect(() => {
    // Join the draft room via WebSocket
    socket.emit('joinRoom', { draftRoomId, userId: user.uid });
    console.log(`Joined draft room: ${draftRoomId} as ${user.displayName || user.inGameName}`);

    // Listen for updates from the WebSocket server
    socket.on('updateDraft', (data) => {
      console.log('Received draft update:', data);
      setPlayer1Picks(data.player1Picks || []);
      setPlayer2Picks(data.player2Picks || []);
      setBannedCharacters(data.bannedCharacters || { player1: null, player2: null });
      setCurrentTurn(data.currentTurn);
      setBanPhase(data.banPhase);

      console.log('Current Turn:', data.currentTurn, 'Player 1:', data.players.player1, 'Player 2:', data.players.player2);
      
      const isPlayerTurnNow = (data.players.player1 === user.uid && data.currentTurn === 1) || 
                              (data.players.player2 === user.uid && data.currentTurn === 2);
      
      setIsPlayerTurn(isPlayerTurnNow);
      
      if (isPlayerTurnNow) {
        console.log(`It is ${user.displayName || user.inGameName}'s turn.`);
      } else {
        console.log(`It is not ${user.displayName || user.inGameName}'s turn.`);
      }
    });

    return () => {
      socket.emit('leaveRoom', { draftRoomId, userId: user.uid });
      console.log(`Left draft room: ${draftRoomId}`);
      socket.off('updateDraft');
    };
  }, [draftRoomId, user]);

  const handlePickOrBan = (character) => {
    if (!isPlayerTurn) {
      console.log(`${user.displayName || user.inGameName} tried to move but it's not their turn.`);
      return;
    }

    console.log(`Character selected: ${character.name} by ${user.displayName || user.inGameName}`);
    console.log(`Ban phase: ${banPhase}, Current turn: ${currentTurn}, Is player turn: ${isPlayerTurn}`);

    socket.emit('makeMove', {
      draftRoomId,
      userId: user.uid,
      character,
      phase: banPhase ? 'ban' : 'pick',
      player1,
      player2,
    });

    console.log(`Move made by: ${user.displayName || user.inGameName}, Current turn: ${currentTurn}`);
  };

  return (
    <div className="draft">
      <h2>Draft Room</h2>
      <CharacterList onSelect={handlePickOrBan} disableSelection={!isPlayerTurn} />
      {/* Display picks and bans */}
      <div>
        <p>{banPhase ? "Ban Phase" : "Pick Phase"}</p>
        <p>Current Turn: {currentTurn === 1 ? player1.inGameName : player2.inGameName}</p>
      </div>
    </div>
  );
};

export default Draft;
