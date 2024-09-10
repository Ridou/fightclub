import React, { useState } from 'react';
import { fetchGameUser, updateUserProfile } from '../firebase'; // Assume fetchGameUser and updateUserProfile exist

function AccountSettings({ user }) {
  const [roleId, setRoleId] = useState(''); // Role ID input
  const [inGameName, setInGameName] = useState(''); // Store in-game name
  const [loading, setLoading] = useState(false);

  const handleSaveRoleId = async () => {
    setLoading(true);
    try {
      const fetchedName = await fetchGameUser(roleId); // Fetch in-game name using roleId
      setInGameName(fetchedName);

      // Update user's profile in Firebase with roleId and in-game name
      await updateUserProfile(user.uid, { roleId, inGameName: fetchedName });
      alert('Your in-game ID and name have been saved!');
    } catch (error) {
      console.error("Error fetching in-game user:", error);
      alert('Failed to save your in-game ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Account Settings</h2>
      <p>Email: {user.email}</p>
      <div>
        <label>In-Game User ID (Role ID):</label>
        <input
          type="text"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          placeholder="Enter your In-Game User ID"
        />
      </div>
      <button onClick={handleSaveRoleId} disabled={loading}>
        {loading ? 'Saving...' : 'Save In-Game ID'}
      </button>
      {inGameName && <p>In-Game Name: {inGameName}</p>}
    </div>
  );
}

export default AccountSettings;
