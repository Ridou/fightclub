import React, { useState } from 'react';

function AccountDetails({ user }) {
  const [roleId, setRoleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [inGameName, setInGameName] = useState('');

  // Handle fetching game user info from the server
  const handleFetchGameUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/${user.uid}`);
      if (!response.ok) throw new Error('Failed to fetch game user');
      const data = await response.json();
      setInGameName(data.name); // Assuming the name is returned
    } catch (error) {
      console.error("Error fetching game user:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle updating user profile
  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, name: inGameName }),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      const data = await response.json();
      console.log('Profile updated:', data);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Account Details</h2>
      <p>Email: {user.email}</p>
      <div>
        <label>In-Game User ID (Role ID):</label>
        <input
          type="text"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          placeholder="Enter your In-Game User ID"
        />
        <button onClick={handleFetchGameUser} disabled={loading}>
          {loading ? 'Fetching...' : 'Fetch Game User'}
        </button>
        <button onClick={handleUpdateProfile} disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
      {inGameName && <p>In-Game Name: {inGameName}</p>}
    </div>
  );
}

export default AccountDetails;
