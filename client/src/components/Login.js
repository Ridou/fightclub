import React, { useState } from 'react';

function Login({ onLogin }) {
  const [roleId, setRoleId] = useState(''); // Store roleId input
  const [email, setEmail] = useState(''); // Store user email input

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleId || !email) {
      alert('Please enter both your In-Game User ID and email.');
      return;
    }
    await onLogin(roleId, email); // Pass roleId and email to the login function
  };

  return (
    <div>
      <h2>Login with Google</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        <div>
          <label>In-Game User ID (Role ID):</label>
          <input
            type="text"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            placeholder="Enter your In-Game User ID"
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
