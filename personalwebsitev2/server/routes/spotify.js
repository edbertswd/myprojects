const express = require('express');
const router = express.Router();
const spotifyService = require('../services/spotifyService');

// Fallback local cache if no req.cache
const localCache = new Map();
const getCache = (req, key) => {
  if (req.cache?.get) return req.cache.get(key);
  const e = localCache.get(key);
  if (!e) return null;
  if (Date.now() > e.expires) {
    localCache.delete(key);
    return null;
  }
  return e.value;
};

const setCache = (req, key, val, ttlSecs) => {
  if (req.cache?.set) return req.cache.set(key, val, ttlSecs);
  localCache.set(key, { value: val, expires: Date.now() + ttlSecs * 1000 });
};

// Enhanced error handler for consistent API responses
const sendError = (res, err, defaultStatus = 500) => {
  const status = err?.statusCode || err?.status || defaultStatus;
  
  res.status(status).json({
    error: err?.message || 'Internal server error',
    statusCode: status,
    timestamp: new Date().toISOString(),
    // Always include empty arrays for frontend compatibility
    items: [],
    total: 0
  });
};

// Authentication endpoints
router.get('/auth', (_req, res) => {
  try {
    res.json({ authUrl: spotifyService.getAuthUrl() });
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ 
      error: 'Authorization code is required',
      statusCode: 400,
      timestamp: new Date().toISOString()
    });

    const result = await spotifyService.setTokens(code);
    res.json({
      message: 'Authorization successful! Save these tokens in your .env file.',
      tokens: result.tokens,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/tokens', (req, res) => {
  try {
    const { accessToken, refreshToken } = req.body || {};
    if (!accessToken || !refreshToken) {
      return res.status(400).json({ 
        error: 'Both accessToken and refreshToken are required',
        statusCode: 400,
        timestamp: new Date().toISOString()
      });
    }
    
    spotifyService.setStoredTokens(accessToken, refreshToken);
    res.json({ 
      message: 'Tokens set successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    sendError(res, err);
  }
});

// Profile endpoint - comprehensive Spotify stats
router.get('/profile', async (req, res) => {
  try {
    const key = 'spotify_profile_complete';
    const cached = getCache(req, key);
    if (cached) return res.json({ ...cached, cached: true });

    // Fetch comprehensive profile data
    const [
      userProfile,
      topTracks,
      topArtists,
      recentTracks,
      currentPlaying,
      playlists
    ] = await Promise.all([
      spotifyService.getUserProfile(),
      spotifyService.getTopTracks(20),
      spotifyService.getTopArtists(20), 
      spotifyService.getRecentlyPlayed(20),
      spotifyService.getCurrentlyPlaying(),
      spotifyService.getUserPlaylists(20)
    ]);

    const profileData = {
      // User profile info
      profile: userProfile || {
        id: null,
        display_name: 'Unknown User',
        followers: { total: 0 },
        images: []
      },
      
      // Always ensure arrays exist
      topTracks: {
        items: topTracks?.items || [],
        total: topTracks?.total || 0
      },
      topArtists: {
        items: topArtists?.items || [],
        total: topArtists?.total || 0
      },
      recentTracks: {
        items: recentTracks?.items || [],
        total: recentTracks?.total || 0
      },
      playlists: {
        items: playlists?.items || [],
        total: playlists?.total || 0
      },
      
      // Current playing info
      currentPlaying: currentPlaying || { is_playing: false, item: null },
      
      // Computed stats - with fallbacks
      stats: {
        favoriteTrack: (topTracks?.items && topTracks.items.length > 0) ? topTracks.items[0] : null,
        favoriteArtist: (topArtists?.items && topArtists.items.length > 0) ? topArtists.items[0] : null,
        totalPlaylists: playlists?.total || 0,
        totalFollowers: userProfile?.followers?.total || 0,
        isCurrentlyPlaying: currentPlaying?.is_playing || false,
        hasRecentActivity: (recentTracks?.items && recentTracks.items.length > 0)
      },
      
      timestamp: new Date().toISOString(),
      cached: false,
      success: true
    };

    setCache(req, key, profileData, 600); // Cache for 10 minutes
    res.json(profileData);
  } catch (err) {
    // Return structured error response with empty arrays
    res.json({
      profile: { id: null, display_name: 'Unknown User', followers: { total: 0 }, images: [] },
      topTracks: { items: [], total: 0 },
      topArtists: { items: [], total: 0 },
      recentTracks: { items: [], total: 0 },
      playlists: { items: [], total: 0 },
      currentPlaying: { is_playing: false, item: null },
      stats: {
        favoriteTrack: null,
        favoriteArtist: null,
        totalPlaylists: 0,
        totalFollowers: 0,
        isCurrentlyPlaying: false,
        hasRecentActivity: false
      },
      error: err.message,
      timestamp: new Date().toISOString(),
      cached: false,
      success: false
    });
  }
});

// Individual data endpoints with consistent structure
router.get('/top-tracks', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const timeRange = req.query.time_range || 'medium_term';
    const key = `spotify_top_tracks_${limit}_${timeRange}`;
    
    const cached = getCache(req, key);
    if (cached) return res.json({ ...cached, cached: true });

    const topTracks = await spotifyService.getTopTracks(limit, timeRange);
    const response = {
      ...topTracks,
      cached: false,
      success: !topTracks.error
    };
    
    setCache(req, key, response, 600);
    res.json(response);
  } catch (err) {
    res.json({
      items: [],
      total: 0,
      limit: parseInt(req.query.limit) || 20,
      offset: 0,
      error: err.message,
      cached: false,
      success: false
    });
  }
});

router.get('/top-artists', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const timeRange = req.query.time_range || 'medium_term';
    const key = `spotify_top_artists_${limit}_${timeRange}`;
    
    const cached = getCache(req, key);
    if (cached) return res.json({ ...cached, cached: true });

    const topArtists = await spotifyService.getTopArtists(limit, timeRange);
    const response = {
      ...topArtists,
      cached: false,
      success: !topArtists.error
    };
    
    setCache(req, key, response, 600);
    res.json(response);
  } catch (err) {
    res.json({
      items: [],
      total: 0,
      limit: parseInt(req.query.limit) || 20,
      offset: 0,
      error: err.message,
      cached: false,
      success: false
    });
  }
});

router.get('/currently-playing', async (req, res) => {
  try {
    const key = 'spotify_current_playing';
    const cached = getCache(req, key);
    if (cached) return res.json({ ...cached, cached: true });

    const currentPlaying = await spotifyService.getCurrentlyPlaying();
    const response = {
      ...currentPlaying,
      cached: false,
      success: !currentPlaying.error
    };
    
    setCache(req, key, response, 30); // Short cache for real-time data
    res.json(response);
  } catch (err) {
    res.json({
      is_playing: false,
      item: null,
      error: err.message,
      cached: false,
      success: false
    });
  }
});

// Legacy endpoints (keep for backward compatibility)
router.get('/top-track', async (req, res) => {
  try {
    const key = 'spotify_top_track';
    const cached = getCache(req, key);
    if (cached) return res.json({ ...cached, cached: true });

    const topTrack = await spotifyService.getTopTrack();
    const response = {
      ...topTrack,
      cached: false,
      success: !topTrack.error
    };
    
    setCache(req, key, response, 600);
    res.json(response);
  } catch (err) {
    res.json({
      track: null,
      total: 0,
      error: err.message,
      cached: false,
      success: false
    });
  }
});

router.get('/top-playlist', async (req, res) => {
  try {
    const key = 'spotify_top_playlist';
    const cached = getCache(req, key);
    if (cached) return res.json({ ...cached, cached: true });

    const topPlaylist = await spotifyService.getTopPlaylist();
    const response = {
      ...topPlaylist,
      cached: false,
      success: !topPlaylist.error
    };
    
    setCache(req, key, response, 900);
    res.json(response);
  } catch (err) {
    res.json({
      playlist: null,
      total: 0,
      error: err.message,
      cached: false,
      success: false
    });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const key = 'spotify_dashboard';
    const cached = getCache(req, key);
    if (cached) return res.json({ ...cached, cached: true });

    const [topTrack, topPlaylist] = await Promise.all([
      spotifyService.getTopTrack(),
      spotifyService.getTopPlaylist()
    ]);

    const dashboard = { 
      topTrack: topTrack || { track: null, total: 0 },
      topPlaylist: topPlaylist || { playlist: null, total: 0 },
      timestamp: new Date().toISOString(),
      success: true
    };
    
    setCache(req, key, dashboard, 600);
    res.json({ ...dashboard, cached: false });
  } catch (err) {
    res.json({
      topTrack: { track: null, total: 0 },
      topPlaylist: { playlist: null, total: 0 },
      error: err.message,
      timestamp: new Date().toISOString(),
      cached: false,
      success: false
    });
  }
});

module.exports = router;