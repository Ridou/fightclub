import React, { useState, useEffect } from 'react';
import CharacterCard from './CharacterCard'; // Import the CharacterCard component
import { fetchCharacters, getUserTeam, saveUserTeam } from '../firebase'; // Ensure correct imports
import '../styles/Team.css';

function Team({ user }) {
  const [team, setTeam] = useState([]); // Initialize as an empty array
  const [availableCharacters, setAvailableCharacters] = useState([]); // State for available characters
  const [editingTeam, setEditingTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const maxTeamSize = 12;

  // Fetch user team data from Firestore when the component loads
  useEffect(() => {
    const fetchUserTeamData = async () => {
      try {
        const fetchedTeam = await getUserTeam(user.uid);
        if (fetchedTeam && fetchedTeam.length > 0) {
          setTeam(fetchedTeam); // Set the team if fetched
        } else {
          setTeam([]); // Reset to empty array if no team exists
        }
      } catch (error) {
        console.error('Error fetching team:', error);
        setErrorMessage('Error fetching team data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserTeamData();
  }, [user.uid]);

  // Fetch available characters
  useEffect(() => {
    const fetchAvailableCharacters = async () => {
      try {
        const characters = await fetchCharacters();
        setAvailableCharacters(characters);
      } catch (error) {
        console.error('Error fetching available characters:', error);
        setErrorMessage('Error fetching available characters.');
      }
    };

    fetchAvailableCharacters();
  }, []);

  // Handle adding a character to the team
  const handleCharacterSelection = (character) => {
    if (team.length < maxTeamSize && !team.some((char) => char.name === character.name)) {
      setTeam([...team, character]);
      setAvailableCharacters(availableCharacters.filter((char) => char.name !== character.name)); // Remove from pool
    } else {
      setErrorMessage('Team is full or character already selected.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Handle removing a character from the team
  const removeCharacterFromTeam = (characterName) => {
    const removedCharacter = team.find((char) => char.name === characterName);
    setTeam(team.filter((char) => char.name !== characterName));
    setAvailableCharacters([...availableCharacters, removedCharacter]); // Return to pool
  };

  // Toggle editing and save team to Firestore
  const toggleEditingTeam = async () => {
    if (editingTeam) {
      setLoading(true);
      try {
        await saveUserTeam(user.uid, team);
        alert('Team saved successfully!');
      } catch (error) {
        console.error('Error saving team:', error);
        alert('Failed to save the team.');
      } finally {
        setLoading(false);
      }
    }
    setEditingTeam(!editingTeam);
  };

  return (
    <div className="right-section">
      <h2>Your Team</h2>
      {loading ? (
        <p>Loading team...</p>
      ) : (
        <>
          <button className="edit-team-button" onClick={toggleEditingTeam}>
            {editingTeam ? 'Save Team' : 'Edit Team'}
          </button>
          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="team-grid">
            {team.length > 0 ? (
              team.map((character, index) => (
                <CharacterCard
                  key={index}
                  character={character}
                  onClick={() => editingTeam && removeCharacterFromTeam(character.name)}
                />
              ))
            ) : (
              <p>No characters in your team yet.</p>
            )}
            {team.length < maxTeamSize &&
              Array.from({ length: maxTeamSize - team.length }).map((_, i) => (
                <div key={i} className="placeholder">Empty Slot</div>
              ))}
          </div>

          {editingTeam && (
            <div className="character-selection">
              <h3>Select Characters:</h3>
              <div className="character-grid">
                {availableCharacters.map((character, index) => (
                  <CharacterCard
                    key={index}
                    character={character}
                    onClick={() => handleCharacterSelection(character)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Team;
