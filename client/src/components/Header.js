import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserProfile, getUserTeam } from '../firebase'; // Import functions to fetch user data
import '../styles/Header.css'; // Import the Header CSS

const Header = ({ user, handleLogout }) => {
  const [inGameName, setInGameName] = useState('');
  const [team, setTeam] = useState([]);
  const navigate = useNavigate(); // Use useNavigate instead of useHistory

  // Fetch user profile and team when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          // Fetch the user profile from Firestore (or cache)
          const profile = await getUserProfile(user.uid);
          setInGameName(profile.inGameName || 'Unknown User');

          // Fetch the user's team from Firestore (or cache)
          const userTeam = await getUserTeam(user.uid);
          setTeam(userTeam || []);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

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
    if (!inGameName || inGameName.trim() === '' || inGameName === 'Unknown User') {
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
          <li><Link to="/tournament">Tournament</Link></li>
          <li><Link to="/ladder">Ladder</Link></li>
        </ul>
      </nav>
      <div className="user-info">
        {user ? (
          <>
            {/* Display user photo if available, otherwise display the in-game name */}
            <Link to="/account" className="username">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="User Avatar" 
                  className="user-avatar"
                  style={{ borderRadius: '50%', width: '45px', height: '45px' }} // Adjust image style as needed
                />
              ) : (
                inGameName || 'Account'
              )}
            </Link>
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
