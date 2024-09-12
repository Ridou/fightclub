import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css'; // Import the Header CSS

const Header = ({ user, inGameName, handleLogout }) => {
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
            <Link to="/account" className="username">{inGameName}</Link> {/* Make in-game name clickable */}
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
