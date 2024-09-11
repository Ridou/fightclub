// client/src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ user }) => {
  return (
    <header className="header">
      <nav>
        <ul className="nav-links">
          <li><Link to="/account">Account</Link></li>
          <li><Link to="/characters">Characters</Link></li>
          <li><Link to="/draft">Draft</Link></li>
        </ul>
      </nav>
      <div className="user-info">
        {user ? <span>{user.email}</span> : <Link to="/login">Sign In</Link>}
      </div>
    </header>
  );
};

export default Header;
