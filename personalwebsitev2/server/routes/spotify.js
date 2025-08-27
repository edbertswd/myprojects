const express = require('express');
const router = express.Router();
const spotifyService = require('../services/spotifyService');

// Get authorization URL (for initial setup)
router.get('/auth', (req, res) => {
  try {
    const authUrl = spotifyService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle callback from Spotify (for initial setup)
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const result = await spotifyService.setTokens(code);
    res.json({ 
      message: 'Authorization successful! Save these tokens in your .env file.',
      tokens: result.tokens 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set tokens manually (when you have them stored)
router.post('/tokens', (req, res) => {
  try {
    const { accessToken, refreshToken } = req.body;
    if (!accessToken || !refreshToken) {
      return res.status(400).json({ error: 'Both accessToken and refreshToken are required' });
    }

    spotifyService.setStoredTokens(accessToken, refreshToken);
    res.json({ message: 'Tokens set successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top track with caching
router.get('/top-track', async (req, res) => {
  try {
    const cacheKey = 'spotify_top_track';
    const cached = req.cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const topTrack = await spotifyService.getTopTrack();
    
    // Cache for 10 minutes
    req.cache.set(cacheKey, topTrack, 600);
    
    res.json({ ...topTrack, cached: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top playlist with caching
router.get('/top-playlist', async (req, res) => {
  try {
    const cacheKey = 'spotify_top_playlist';
    const cached = req.cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const topPlaylist = await spotifyService.getTopPlaylist();
    
    // Cache for 15 minutes (playlists change less frequently)
    req.cache.set(cacheKey, topPlaylist, 900);
    
    res.json({ ...topPlaylist, cached: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get both top track and playlist in one request
router.get('/dashboard', async (req, res) => {
  try {
    const cacheKey = 'spotify_dashboard';
    const cached = req.cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const [topTrack, topPlaylist] = await Promise.all([
      spotifyService.getTopTrack().catch(err => ({ error: err.message })),
      spotifyService.getTopPlaylist().catch(err => ({ error: err.message }))
    ]);

    const dashboard = {
      topTrack,
      topPlaylist,
      timestamp: new Date().toISOString()
    };

    // Cache for 10 minutes
    req.cache.set(cacheKey, dashboard, 600);
    
    res.json({ ...dashboard, cached: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;