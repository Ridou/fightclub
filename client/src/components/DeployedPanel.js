// DeployedPanel.js
import React from 'react';
import CharacterCard from './CharacterCard';
import '../styles/DeployedPanel.css';

const DeployedPanel = ({ deployedTeam }) => {
  const maxDeployed = 5;
  const deployedSlots = [...deployedTeam];

  while (deployedSlots.length < maxDeployed) {
    deployedSlots.push({ name: 'Empty Slot', rarity: 'common', imageUrl: '' });
  }

  return (
    <div className="deployed-panel">
      <h3>Deployable Team</h3>
      <div className="deployed-grid">
        {deployedSlots.map((character, index) => (
          <CharacterCard
            key={index}
            character={character}
            isBanned={false}
            onClick={null}
          />
        ))}
      </div>
    </div>
  );
};

export default DeployedPanel;
