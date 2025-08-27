const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
require('dotenv').config();

const spotifyRoutes = require('./routes/spotify');
const pokemonRoutes = require('./routes/pokemon');

const app = express();

// Initialize cache 
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

// Health check - both endpoints for flexibility
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'production'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'production',
    cache: {
      keys: cache.keys().length,
      stats: cache.getStats()
    }
  });
});

// Routes
app.use('/api/spotify', spotifyRoutes);
app.use('/api/pokemon', pokemonRoutes);

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
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Namecheap/cPanel optimized server start
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running on Namecheap`);
  console.log(`📊 Health: /health and /api/health`);
  console.log(`🎵 Spotify: /api/spotify/*`);
  console.log(`🐾 Pokemon: /api/pokemon/*`);
});