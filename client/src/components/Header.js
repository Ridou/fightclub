import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Header.css'; // Import the Header CSS

const Header = ({ user, inGameName, team, handleLogout }) => {
  const navigate = useNavigate(); // Use useNavigate instead of useHistory

  // Handle the Fight Now logic
  const handleFightNow = () => {
    if (!user) {
      alert('Please log in to fight!');
      return;
    }

    // Log the values to ensure we're getting the correct data
    console.log('User:', user);
    console.log('In-Game Name:', inGameName);
    console.log('Team:', team);

    // Check if the in-game name is set and team has 12 members
    if (!inGameName || inGameName.trim() === '') {
      alert('Please set your in-game username before fighting!');
      navigate('/account'); // Redirect to account page for username setup
      return;
    }

    if (!team || team.length !== 12) {
      alert('You need to create a full 12-man team before fighting!');
      navigate('/account'); // Redirect to account page for team setup
      return;
    }

    // If both username and team are set, navigate to the match page
    navigate('/match');
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
