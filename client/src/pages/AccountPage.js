// src/pages/AccountPage.js
import React from 'react';
import AccountDetails from '../components/AccountDetails';
import Team from '../components/Team';
import MatchHistory from '../components/MatchHistory';
import '../styles/AccountPage.css'; // Import main account page styles

function AccountPage({ user }) {
  return (
    <div className="account-container">
      <AccountDetails user={user} />
      <Team user={user} savedTeam={user.team} />
      <MatchHistory user={user} />
    </div>
  );
}

export default AccountPage;
