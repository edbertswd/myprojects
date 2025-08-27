const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
require('dotenv').config();

const spotifyRoutes = require('./routes/spotify');
const pokemonRoutes = require('./routes/pokemon');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize cache (TTL: 5 minutes for most data)
const cache = new NodeCache({ stdTTL: 300 });

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

app.use(express.json());

// Make cache available to routes
app.use((req, res, next) => {
  req.cache = cache;
  next();
});

// Routes
app.use('/api/spotify', spotifyRoutes);
app.use('/api/pokemon', pokemonRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});