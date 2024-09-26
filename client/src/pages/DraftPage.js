import React, { useState, useEffect } from 'react';
import ReadyCheckPopup from './ReadyCheckPopup';
import TeamPanel from './TeamPanel';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

const DraftPage = ({ user, draftRoomId }) => {
  const [ready, setReady] = useState(false); // Manage ready state
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [player1BannedCharacters, setPlayer1BannedCharacters] = useState([]);
  const [player2BannedCharacters, setPlayer2BannedCharacters] = useState([]);

  // Listen to updates in the Realtime Database for the draft room
  useEffect(() => {
    const draftRoomRef = ref(rtdb, `draftRooms/${draftRoomId}`);
    
    const unsubscribe = onValue(draftRoomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayer1(data.player1 || {});
        setPlayer2(data.player2 || {});
        setPlayer1BannedCharacters(data.player1?.bannedCharacters || []);
        setPlayer2BannedCharacters(data.player2?.bannedCharacters || []);
      }
    });

    return () => unsubscribe();
  }, [draftRoomId]);

  const handleReadyComplete = () => {
    setReady(true); // Both players are ready, proceed with the draft
  };

  return (
    <div className="draft-page">
      {!ready && (
        <ReadyCheckPopup
          player1={player1}
          player2={player2}
          user={user}
          draftRoomId={draftRoomId}
          onReadyComplete={handleReadyComplete}
        />
      )}

      {ready && (
        <div className="team-panels">
          {/* Display both players' teams */}
          <TeamPanel
            playerData={player1}
            isBanPhase={true} // Assuming ban phase starts right after ready check
            bannedCharacters={player1BannedCharacters} // Player 1's banned characters
            side="left"
          />
          <TeamPanel
            playerData={player2}
            isBanPhase={true}
            bannedCharacters={player2BannedCharacters} // Player 2's banned characters
            side="right"
          />
        </div>
      )}
    </div>
  );
};

export default DraftPage;
