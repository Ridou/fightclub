import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Header.css'; // Import the Header CSS

const Header = ({ user, inGameName, handleLogout }) => {
  const navigate = useNavigate(); // Use useNavigate instead of useHistory

  // Handle the Fight Now logic
  const handleFightNow = () => {
    if (!user) {
      alert('Please log in to fight!');
      return;
    }

    // Check if the user has a team saved
    axios.get(`/api/getTeam/${user.uid}`)
      .then((response) => {
        if (response.data.team && response.data.team.length === 12) {
          // Navigate to the matchmaking queue
          navigate('/matchmaking');
        } else {
          alert('You need to set up your team before fighting!');
          navigate('/account');
        }
      })
      .catch(() => {
        alert('Error retrieving team');
        navigate('/account');
      });
  };

  return (
    <header className="header">
      <div className="logo">
        <Link to="/">Fight Club</Link> {/* Add project name as a link to the home page */}
      </div>
      <nav>
        <ul className="nav-links">
          <li><Link to="/account">Account</Link></li>
          <li><Link to="/characters">Characters</Link></li>
          <li><Link to="/draft">Draft</Link></li>
          <li><Link to="/ladder">Ladder</Link></li>
          <li><Link to="/match">Match</Link></li> {/* New Match link to the queue */}
        </ul>
      </nav>
      <div className="user-info">
        {user ? (
          <>
            <Link to="/account" className="username">{inGameName || 'Account'}</Link> {/* Display in-game name if available */}
            <button onClick={handleFightNow} className="fight-now-button">Fight Now</button> {/* Fight Now button */}
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Sign In</Link>
        )}
      </div>
    </header>
  );
};

export default Header;
