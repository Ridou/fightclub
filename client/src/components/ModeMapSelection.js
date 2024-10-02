import React, { useState } from 'react';

const ModeMapSelection = ({ onSelection }) => {
  const [mode, setMode] = useState('Free Mode');
  const [map, setMap] = useState('Hollowed Mine');

  const handleModeChange = (event) => {
    setMode(event.target.value);
  };

  const handleMapChange = (event) => {
    setMap(event.target.value);
  };

  const handleSubmit = () => {
    onSelection({ mode, map });
  };

  return (
    <div>
      <h2>Select Mode and Map</h2>
      <div>
        <label>
          Mode:
          <select value={mode} onChange={handleModeChange}>
            <option value="Free Mode">Free Mode</option>
            <option value="Ban Mode">Ban Mode</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Map:
          <select value={map} onChange={handleMapChange}>
            <option value="Hollowed Mine">Hollowed Mine</option>
            <option value="Scorching Hills">Scorching Hills</option>
          </select>
        </label>
      </div>
      <button onClick={handleSubmit}>Confirm</button>
    </div>
  );
};

export default ModeMapSelection;