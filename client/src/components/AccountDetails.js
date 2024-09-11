import React, { useState, useEffect } from 'react';
import { saveUserProfile, getUserProfile } from '../firebase'; // Import Firestore functions

function AccountDetails({ user }) {
  const [roleId, setRoleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [inGameName, setInGameName] = useState('');
  const [roleLevel, setRoleLevel] = useState('');
  const [region, setRegion] = useState('');

  // Fetch in-game user info from external API
  const fetchGameUserInfo = async (roleId) => {
    const apiUrl = `https://xdsdk-intnl-6.xd.com/product/v1/query/game/role?source=webpay&pt=Windows&appId=2048001&serverId=usprod&roleId=${roleId}`;
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.code === 200) {
        const { name, roleLv, region } = data.data;
        setInGameName(name);
        setRoleLevel(roleLv);
        setRegion(region);

        // Save profile to Firestore
        await saveUserProfile(user.uid, { roleId, inGameName: name, roleLevel: roleLv, region });
      } else {
        console.error("Failed to fetch game user info:", data.msg);
      }
    } catch (error) {
      console.error("Error fetching game user info:", error);
    }
  };

  // Handle updating user profile
  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      console.log("Updating profile for Role ID:", roleId);
      await fetchGameUserInfo(roleId); // Fetch and save game data
      console.log("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load user profile from Firestore on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        console.log("Loading user profile...");
        const profile = await getUserProfile(user.uid);
        if (profile) {
          console.log("Profile data loaded:", profile);
          setRoleId(profile.roleId || '');
          setInGameName(profile.inGameName || '');
          setRoleLevel(profile.roleLevel || '');
          setRegion(profile.region || '');
        } else {
          console.log("No profile data found for user.");
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };

    loadUserProfile();
  }, [user]);

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
        <button onClick={handleUpdateProfile} disabled={loading}>
          {loading ? 'Fetching...' : 'Fetch Game User'}
        </button>
      </div>
      {inGameName && <p>In-Game Name: {inGameName}</p>}
      {roleLevel && <p>Role Level: {roleLevel}</p>}
      {region && <p>Region: {region}</p>}
    </div>
  );
}

export default AccountDetails;
