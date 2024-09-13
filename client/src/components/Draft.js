import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getDatabase, ref, runTransaction, onValue } from 'firebase/database';
import CharacterList from './CharacterList'; // Import CharacterList
import '../styles/Draft.css'; // Ensure the styles are here

const Draft = ({ user }) => {
  const location = useLocation();
  const { player1, player2 } = location.state;
  const db = getDatabase();

  // Helper function to generate consistent draftRoomId
  const generateDraftRoomId = (player1Id, player2Id) => {
    const sortedIds = [player1Id, player2Id].sort(); // Sort IDs to ensure consistency
    return `draft-${sortedIds[0]}-${sortedIds[1]}`;
  };

  const draftRoomId = generateDraftRoomId(player1.uid, player2.uid);
  console.log("Generated Draft Room ID:", draftRoomId);

  const [player1Picks, setPlayer1Picks] = useState([]); // Player 1's picks
  const [player2Picks, setPlayer2Picks] = useState([]); // Player 2's picks
  const [bannedCharacters, setBannedCharacters] = useState({ player1: null, player2: null }); // Banned characters
  const [currentTurn, setCurrentTurn] = useState(1); // Player 1 starts
  const [banPhase, setBanPhase] = useState(true); // Ban phase
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Ensure data is loaded before proceeding
  const isPlayer1 = user.uid === player1.uid; // Check if the current user is Player 1

  // Safely handle team existence
  const player1Team = (player1 && player1.team) ? player1.team.slice(0, 12) : []; // First 12 from Player 1's team
  const player2Team = (player2 && player2.team) ? player2.team.slice(0, 12) : []; // First 12 from Player 2's team

  // Listen to real-time updates in the draft room
  useEffect(() => {
    const draftRoomRef = ref(db, `draftRooms/${draftRoomId}`);

    // Listen for changes to the draft room data
    const unsubscribe = onValue(draftRoomRef, (snapshot) => {
      const draftData = snapshot.val();
      if (draftData) {
        console.log("Real-time update received from Firebase:", JSON.stringify(draftData, null, 2));

        // Update state with new values from Firebase
        setPlayer1Picks(draftData.player1Picks || []); // Update player 1's picks
        setPlayer2Picks(draftData.player2Picks || []); // Update player 2's picks
        setBannedCharacters(draftData.bannedCharacters || { player1: null, player2: null }); // Update bans
        setCurrentTurn(draftData.currentTurn); // Update current turn
        setBanPhase(draftData.banPhase);

        // Check if it's the current player's turn
        if ((isPlayer1 && draftData.currentTurn === 1) || (!isPlayer1 && draftData.currentTurn === 2)) {
          setIsPlayerTurn(true);
          console.log(`${user.displayName || user.inGameName} (You) - It is your turn.`);
        } else {
          setIsPlayerTurn(false);
          console.log(`${user.displayName || user.inGameName} (You) - It is not your turn.`);
        }

        setIsLoaded(true); // Data is fully loaded
      } else {
        console.log("No data found in the Firebase draft room.");
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [db, draftRoomId, isPlayer1, user]);

// Handle character picks and bans
const handlePickOrBan = (character) => {
  if (!isPlayerTurn) {
    console.log(`${user.displayName || user.inGameName} tried to move but it's not their turn.`);
    return;
  }

  const draftRoomRef = ref(db, `draftRooms/${draftRoomId}`);

  runTransaction(draftRoomRef, (draftData) => {
    if (draftData) {
      // Ensure picks arrays exist
      draftData.player1Picks = draftData.player1Picks || [];
      draftData.player2Picks = draftData.player2Picks || [];
      draftData.bannedCharacters = draftData.bannedCharacters || { player1: null, player2: null };

      console.log("Current draftData:", JSON.stringify(draftData, null, 2));
      console.log(`Current turn: Player ${draftData.currentTurn}, Ban phase: ${banPhase ? 'Yes' : 'No'}`);

      // Force Player 1 to start the ban phase
      if (banPhase) {
        if (currentTurn === 1 && !draftData.bannedCharacters.player2) {
          console.log("Player 1 is banning a character from Player 2's team.");
          draftData.bannedCharacters.player2 = character; // Player 1 bans Player 2's character
          draftData.currentTurn = 2; // Switch to Player 2's turn to ban
          console.log("Player 2's turn to ban.");
        } else if (currentTurn === 2 && !draftData.bannedCharacters.player1) {
          console.log("Player 2 is banning a character from Player 1's team.");
          draftData.bannedCharacters.player1 = character; // Player 2 bans Player 1's character
          draftData.currentTurn = 1; // Switch to Player 1's pick turn
          draftData.banPhase = false; // End ban phase
          console.log("Ban phase ended. Switching to pick phase.");
        }
      } else {
        // Handle picking logic and ensure correct turn order
        if (currentTurn === 1 && draftData.player1Picks.length < 5) {
          console.log(`Player 1 is picking: ${character.name}`);
          draftData.player1Picks.push(character); // Player 1 picks a character
          if (draftData.player1Picks.length === 1) {
            draftData.currentTurn = 2; // Player 2 picks two characters
            console.log("Player 2's turn to pick.");
          } else if (draftData.player1Picks.length >= 2) {
            draftData.currentTurn = 2; // Switch to Player 2's turn
          }
        } else if (currentTurn === 2 && draftData.player2Picks.length < 5) {
          console.log(`Player 2 is picking: ${character.name}`);
          draftData.player2Picks.push(character); // Player 2 picks a character
          if (draftData.player2Picks.length === 1) {
            draftData.currentTurn = 1; // Player 1 picks two characters
            console.log("Player 1's turn to pick.");
          } else if (draftData.player2Picks.length >= 2) {
            draftData.currentTurn = 1; // Switch to Player 1's turn
          }
        }
      }
    } else {
      console.log("No draftData found.");
    }

    return draftData;
  })
    .then(() => {
      console.log(`${user.displayName || user.inGameName} successfully made a move.`);
    })
    .catch((error) => {
      console.error("Error processing move:", error);
    });
};


  return isLoaded ? (
    <div className="draft">
      <div className="draft-header">
        <h2>1v1 Draft</h2>
        <p>
          {banPhase
            ? currentTurn === 1
              ? `${player1.inGameName}'s turn to ban`
              : `${player2.inGameName}'s turn to ban`
            : currentTurn === 1
            ? `${player1.inGameName}'s turn to pick`
            : `${player2.inGameName}'s turn to pick`}
        </p>
      </div>

      <div className="draft-container">
        {/* Left Panel - Player 1 Picks */}
        <div className="player-panel">
          <h3>{player1.inGameName}'s Picks</h3>
          <div className="picks">
            {player1Picks.map((pick, index) => (
              <div key={index} className={`character-card ${pick.rarity}`}>
                <img src={pick.imageUrl} alt={pick.name} />
                <h3>{pick.name}</h3>
              </div>
            ))}
          </div>
          <h3>{player1.inGameName}'s Banned Character</h3>
          <div className="banned">
            {bannedCharacters.player1 ? (
              <div className={`character-card ${bannedCharacters.player1.rarity}`}>
                <img src={bannedCharacters.player1.imageUrl} alt={bannedCharacters.player1.name} />
                <h3>{bannedCharacters.player1.name}</h3>
              </div>
            ) : (
              <div className="placeholder">No Ban</div>
            )}
          </div>
        </div>

        {/* Character Selection Grid */}
        <CharacterList
          team1={player1Team} // Show only player 1's team
          team2={player2Team} // Show only player 2's team
          onSelect={(character) => handlePickOrBan(character)}
          disableSelection={!isPlayerTurn} // Only allow selection when it's the player's turn
        />

        {/* Right Panel - Player 2 Picks */}
        <div className="player-panel">
          <h3>{player2.inGameName}'s Picks</h3>
          <div className="picks">
            {player2Picks.map((pick, index) => (
              <div key={index} className={`character-card ${pick.rarity}`}>
                <img src={pick.imageUrl} alt={pick.name} />
                <h3>{pick.name}</h3>
              </div>
            ))}
          </div>
          <h3>{player2.inGameName}'s Banned Character</h3>
          <div className="banned">
            {bannedCharacters.player2 ? (
              <div className={`character-card ${bannedCharacters.player2.rarity}`}>
                <img src={bannedCharacters.player2.imageUrl} alt={bannedCharacters.player2.name} />
                <h3>{bannedCharacters.player2.name}</h3>
              </div>
            ) : (
              <div className="placeholder">No Ban</div>
            )}
          </div>
        </div>
      </div>

      {/* Show both players' in-game names and role IDs */}
      <div className="player-info">
        <h4>Player 1: {player1.inGameName} - ID: {player1.uid}</h4>
        <h4>Player 2: {player2.inGameName} - ID: {player2.uid}</h4>
      </div>
    </div>
  ) : (
    <p>Loading draft data...</p> // Loading state to ensure data is fully loaded
  );
};

export default Draft;
