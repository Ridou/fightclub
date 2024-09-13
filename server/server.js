const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();

// Import routes
const authRoutes = require('./routes/authRoutes');
const googleRoutes = require('./routes/googleRoutes');
const teamRoutes = require('./routes/teamRoutes'); // Import the new team-related routes

// Enable CORS
app.use(cors());
app.use(express.json());

// Middleware to set headers for Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// Use the routes
app.use('/api', authRoutes); // Authentication-related routes
app.use('/api', googleRoutes); // Google OAuth routes
app.use('/api', teamRoutes);   // Team management routes

// Error handling middleware for routes that aren't found
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
