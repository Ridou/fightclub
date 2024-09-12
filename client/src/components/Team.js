// src/components/Team.js
import React, { useState } from 'react';
import CharacterList from './CharacterList'; // Import the CharacterList component
import { saveUserTeam } from '../firebase'; // Function to save team to Firestore
import '../styles/Team.css'; // Team-specific styles

function Team({ user, savedTeam }) {
  const [team, setTeam] = useState(savedTeam || []);
  const [editingTeam, setEditingTeam] = useState(false);

  // Handle character selection for team
  const handleCharacterSelection = (character) => {
    if (team.length < 12 && !team.includes(character)) {
      setTeam([...team, character]);
    }
  };

  // Toggle between editing and saving team
  const toggleEditingTeam = async () => {
    if (editingTeam) {
      // Save the team to Firestore when the user presses Save
      await saveUserTeam(user.uid, team);
    }
    setEditingTeam(!editingTeam);
  };

  return (
    <div className="right-section">
      <h2>Your Team</h2>
      <button className="edit-team-button" onClick={toggleEditingTeam}>
        {editingTeam ? 'Save Team' : 'Edit Team'}
      </button>
      <div className="team-list">
        {team.length > 0 ? (
          <ul className="team-carousel">
            {team.map((character, index) => (
              <li key={index}>{character.name}</li>
            ))}
          </ul>
        ) : (
          <p>No team selected.</p>
        )}
      </div>

      {editingTeam && (
        <div className="character-carousel">
          <CharacterList onSelect={handleCharacterSelection} />
        </div>
      )}
    </div>
  );
}

export default Team;
