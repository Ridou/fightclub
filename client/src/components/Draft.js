import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ref, onValue, update } from 'firebase/database';
import { getUserProfile, rtdb } from '../firebase';

import CharacterCard from './CharacterCard';
import '../styles/Draft.css';

const Draft = ({ user }) => {
  const location = useLocation();
  const { player1: locationPlayer1, player2: locationPlayer2, draftRoomId } = location.state || {};

  const [player1, setPlayer1] = useState(locationPlayer1 || {});
  const [player2, setPlayer2] = useState(locationPlayer2 || {});

  const [player1Deployed, setPlayer1Deployed] = useState([""]);
  const [player2Deployed, setPlayer2Deployed] = useState([""]);
  const [bannedCharacters, setBannedCharacters] = useState({ player1: [""], player2: [""] });
  const [currentTurn, setCurrentTurn] = useState(1);  // Player 1 starts the game
  const [banPhase, setBanPhase] = useState(true);
  const [timer, setTimer] = useState(60);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [pickOrder, setPickOrder] = useState([1, 2, 2, 1, 1, 2, 2, 1, 1, 2]);
  const [deployed, setDeployed] = useState({ player1: [""], player2: [""] });

  const maxDeployed = 5;

  useEffect(() => {
    if (!player1 || !player2) return;
    const isTurn = user.uid === (currentTurn === 1 ? player1.uid : player2.uid);
    setIsPlayerTurn(isTurn);
    console.log(`User ${user.uid} - Is it my turn? ${isTurn}`);
  }, [currentTurn, user.uid, player1, player2]);

  useEffect(() => {
    if (timer > 0) {
      const timerInterval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer === 1) {
            handleTimerExpiry();
          }
          return prevTimer - 1;
        });
      }, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [timer, currentTurn, banPhase, player1Deployed, player2Deployed]);

  const fetchTeam = async (uid) => await getUserProfile(uid);

  const { data: player1Data, isLoading: isLoadingP1, error: errorP1 } = useQuery({
    queryKey: ['team', player1.uid],
    queryFn: () => fetchTeam(player1.uid),
  });

  const { data: player2Data, isLoading: isLoadingP2, error: errorP2 } = useQuery({
    queryKey: ['team', player2.uid],
    queryFn: () => fetchTeam(player2.uid),
  });

  useEffect(() => {
    const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}`);
  
    const offValueHandler = onValue(draftRoomRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Realtime data received: ", data);
  
      if (data && data.player1 && data.player2) {
        setBanPhase(data.banPhase);
        setCurrentTurn(data.turn);  // Sync current turn from Firebase
        setTimer(data.timer);
  
        setPlayer1Deployed(data.deployed?.player1 || []);
        setPlayer2Deployed(data.deployed?.player2 || []);
        setBannedCharacters(data.bannedCharacters || { player1: [], player2: [] });
  
        // Check whose turn it is based on Firebase 'turn' value
        const isTurn = user.uid === (data.turn === 1 ? data.player1.uid : data.player2.uid);
        setIsPlayerTurn(isTurn);  // Update the client's turn
        console.log(`Updated state: banPhase=${data.banPhase}, turn=${data.turn}, Is it my turn? ${isTurn}`);
      } else {
        console.log("No data found for players in Firebase for draft room");
      }
    }, (error) => {
      console.error("Error reading from Realtime Database:", error);
    });
  
    return () => offValueHandler();
  }, [draftRoomId, user.uid, currentTurn]); // Add currentTurn to the dependency array

  const handleTimerExpiry = () => {
    if (!isPlayerTurn) {
      console.log("It's not your turn yet. Skipping timer action.");
      return;
    }
    
    if (banPhase) {
      if (!player1Data || !player2Data) return;
      const availableCharacters = currentTurn === 1 ? player1Data?.team : player2Data?.team;
      const randomCharacter = availableCharacters.find((char) => !bannedCharacters[`player${currentTurn}`]?.includes(char.name));
      if (randomCharacter) {
        console.log('Timer expired. Auto-banning:', randomCharacter);
        handlePickOrBan(randomCharacter);  // Auto-ban if the timer runs out
      }
    } else {
      // Auto-pick logic (you can implement auto-pick if required)
      console.log('Timer expired. Auto-pick logic.');
    }
  };

  // Update the turn and handle bans or picks properly
  const handlePickOrBan = async (character) => {
    try {
      if (!isPlayerTurn) {
        console.log("It's not your turn yet.");
        return;
      }
  
      const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}`);
  
      if (banPhase) {
        const enemyTeam = currentTurn === 1 ? player2Data?.team : player1Data?.team;
        if (!enemyTeam.includes(character)) {
          console.log("You can only ban from the enemy team.");
          return;
        }
  
        const updatedBannedCharacters = {
          ...bannedCharacters,
          [`player${currentTurn}`]: [character.name],
        };
  
        const nextTurn = currentTurn === 1 ? 2 : 1;  // Alternate turns
        await update(draftRoomRef, {
          turn: nextTurn,
          bannedCharacters: updatedBannedCharacters,
          player1: player1,
          player2: player2,
          banPhase,
          timer: 60,
          deployed,
        });
  
        setBannedCharacters(updatedBannedCharacters);
        setCurrentTurn(nextTurn);
  
        // Check if both players have banned at least one character each
      if (updatedBannedCharacters.player1.length >= 1 && updatedBannedCharacters.player2.length >= 1) {
        console.log("Both players have banned. Transitioning to pick phase.");
        await update(draftRoomRef, {
          banPhase: false,  // End the ban phase
          turn: 1,  // Set the turn back to Player 1 to start the pick phase
          timer: 60,  // Reset the timer
        });
        setBanPhase(false);  // Update the local state to reflect the pick phase
        setCurrentTurn(1);  // Reset turn to Player 1
      }
    } else {
      // Handle picks here if not in ban phase
      const ownTeam = currentTurn === 1 ? player1Data?.team : player2Data?.team;
      if (!ownTeam.includes(character)) {
        console.log("You can only pick from your own team.");
        return;
      }

  
        const updatedDeployed = {
          ...deployed,
          [`player${currentTurn}`]: [...deployed[`player${currentTurn}`], character],
        };
  
        const nextTurn = pickOrder.shift();  // Move to the next pick
        setDeployed(updatedDeployed);
        setCurrentTurn(nextTurn);
  
        await update(draftRoomRef, {
          turn: nextTurn,
          deployed: updatedDeployed,
          player1: player1,
          player2: player2,
          banPhase,
          timer: 60,
        });
  
        console.log(`Successfully updated banPhase=${banPhase}, currentTurn=${currentTurn}`);
      }
    } catch (error) {
      console.error('Error updating the pick/ban:', error);
    }
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
            {player1Data?.team?.map((character, index) => (
              <CharacterCard
                key={index}
                character={character}
                isBanned={
                  bannedCharacters?.player1?.includes(character.name) ||
                  bannedCharacters?.player2?.includes(character.name)
                }
                onClick={() => {
                  if (banPhase) {
                    if (currentTurn === 1 && player1Data?.team.includes(character)) {
                      console.log("You can't ban from your own team.");
                      return;
                    }
                    if (currentTurn === 2 && player2Data?.team.includes(character)) {
                      console.log("You can't ban from your own team.");
                      return;
                    }
                  } else {
                    if (currentTurn === 1 && !player1Data?.team.includes(character)) {
                      console.log("You can only pick from your own team.");
                      return;
                    }
                    if (currentTurn === 2 && !player2Data?.team.includes(character)) {
                      console.log("You can only pick from your own team.");
                      return;
                    }
                  }
                  handlePickOrBan(character);
                }}
                disabled={
                  !isPlayerTurn ||
                  bannedCharacters?.player1?.includes(character.name) ||
                  bannedCharacters?.player2?.includes(character.name)
                }
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
            {player2Data?.team?.map((character, index) => (
              <CharacterCard
                key={index}
                character={character}
                isBanned={
                  bannedCharacters?.player1?.includes(character.name) ||
                  bannedCharacters?.player2?.includes(character.name)
                }
                onClick={() => {
                  if (banPhase) {
                    if (currentTurn === 1 && player1Data?.team.includes(character)) {
                      console.log("You can't ban from your own team.");
                      return;
                    }
                    if (currentTurn === 2 && player2Data?.team.includes(character)) {
                      console.log("You can't ban from your own team.");
                      return;
                    }
                  } else {
                    if (currentTurn === 1 && !player1Data?.team.includes(character)) {
                      console.log("You can only pick from your own team.");
                      return;
                    }
                    if (currentTurn === 2 && !player2Data?.team.includes(character)) {
                      console.log("You can only pick from your own team.");
                      return;
                    }
                  }
                  handlePickOrBan(character);
                }}
                disabled={
                  !isPlayerTurn ||
                  bannedCharacters?.player1?.includes(character.name) ||
                  bannedCharacters?.player2?.includes(character.name)
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Draft;