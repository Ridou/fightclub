import React, { useState, useEffect } from 'react';
import SwipeCarousel from './SwipeCarousel'; // New Swiper component
import CharacterCard from './CharacterCard'; // Import the CharacterCard component
import { fetchCharacters } from './CharacterList'; // Import the function
import { saveUserTeam, getUserProfile } from '../firebase';
import '../styles/Team.css';

function Team({ user }) {
  const [team, setTeam] = useState([]);
  const [availableCharacters, setAvailableCharacters] = useState([]); // State for available characters
  const [editingTeam, setEditingTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const maxTeamSize = 12;

  useEffect(() => {
    const fetchUserTeam = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        const teamWithImages = profile?.team.map((character) => ({
          ...character,
          roleImage: character.roleImage,
          factionImages: character.factionImages,
        }));
        setTeam(teamWithImages || []);
      } catch (error) {
        console.error('Error fetching team:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTeam();
  }, [user.uid]);

  // Fetch available characters
  useEffect(() => {
    const fetchAvailableCharacters = async () => {
      const characters = await fetchCharacters();
      setAvailableCharacters(characters);
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

  const calculateSlidesPerView = (itemsCount) => Math.min(itemsCount, 3);

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

          <div className="team-list">
            {/* Display the selected team */}
            <SwipeCarousel
              items={team}
              renderItem={(character) => (
                <CharacterCard
                  character={character}
                  onClick={() => editingTeam && removeCharacterFromTeam(character.name)}
                />
              )}
              slidesPerView={calculateSlidesPerView(team.length)}
              spaceBetween={10}
              freeMode={true}
              loop={false}
            />
            {team.length < maxTeamSize && <div className="placeholder">Empty Slot</div>}
          </div>

          {editingTeam && (
            <div className="character-carousel">
              <h3>Select Characters:</h3>
              <SwipeCarousel
                items={availableCharacters}
                renderItem={(character) => (
                  <CharacterCard
                    character={character}
                    onClick={() => handleCharacterSelection(character)}
                  />
                )}
                slidesPerView={calculateSlidesPerView(availableCharacters.length)}
                spaceBetween={10}
                freeMode={true}
                loop={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Team;
