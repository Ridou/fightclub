import React from 'react';
import '../styles/Ladder.css'; // Updated the path to the correct folder

function Ladder({ gameData }) {
  return (
    <div className="ladder-container">
      <h2>Ladder</h2>
      <table className="ladder-table">
        <thead>
          <tr>
            <th>Game</th>
            <th>Entry</th>
            <th>Team Size</th>
            <th>Skill Level</th>
            <th>Support</th>
            <th>Starting</th>
            <th>Info</th>
          </tr>
        </thead>
        <tbody>
          {/* Example data, use actual game data here */}
          <tr>
            <td>{gameData.name}</td>
            <td>XP</td>
            <td>2v2</td>
            <td>All Skills</td>
            <td>Tickets</td>
            <td>Available Now</td>
            <td><button className="accept-button">Accept</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Ladder;
