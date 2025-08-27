const axios = require('axios');
require('dotenv').config();

class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    this.accessToken = process.env.SPOTIFY_ACCESS_TOKEN;
    this.refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
    this.baseUrl = 'https://api.spotify.com/v1';
  }

  getAuthUrl() {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-read-recently-played',
      'user-read-currently-playing',
      'user-read-playback-state',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-follow-read',
      'user-library-read'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: this.redirectUri,
    });

    return `https://accounts.spotify.com/authorize?${params}`;
  }

  async setTokens(code) {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
        }), {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, refresh_token } = response.data;
      this.accessToken = access_token;
      this.refreshToken = refresh_token;

      return {
        tokens: {
          accessToken: access_token,
          refreshToken: refresh_token
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  setStoredTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  async refreshAccessToken() {
    try {
      console.log('Refreshing access token...');
      const response = await axios.post('https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }), {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      console.log('Access token refreshed successfully');
      return response.data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error.message);
      throw this.handleError(error);
    }
  }

  async makeSpotifyRequest(endpoint, params = {}) {
    const makeRequest = async () => {
      return await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        params
      });
    };

    try {
      const response = await makeRequest();
      return response.data;
    } catch (error) {
      // Try to refresh token if we get 401
      if (error.response?.status === 401 && this.refreshToken) {
        try {
          await this.refreshAccessToken();
          // Retry the request with new token
          const response = await makeRequest();
          return response.data;
        } catch (refreshError) {
          console.error('Failed to refresh and retry:', refreshError.message);
          throw this.handleError(error);
        }
      }
      throw this.handleError(error);
    }
  }

  // User Profile
  async getUserProfile() {
    try {
      return await this.makeSpotifyRequest('/me');
    } catch (error) {
      return {
        id: null,
        display_name: 'Unknown User',
        followers: { total: 0 },
        images: []
      };
    }
  }

  // Top Tracks - Always return consistent structure
  async getTopTracks(limit = 20, timeRange = 'medium_term') {
    try {
      const data = await this.makeSpotifyRequest('/me/top/tracks', {
        limit,
        time_range: timeRange
      });
      return {
        items: data.items || [],
        total: data.total || 0,
        limit: data.limit || limit,
        offset: data.offset || 0
      };
    } catch (error) {
      return {
        items: [],
        total: 0,
        limit: limit,
        offset: 0,
        error: error.message
      };
    }
  }

  // Top Artists - Always return consistent structure
  async getTopArtists(limit = 20, timeRange = 'medium_term') {
    try {
      const data = await this.makeSpotifyRequest('/me/top/artists', {
        limit,
        time_range: timeRange
      });
      return {
        items: data.items || [],
        total: data.total || 0,
        limit: data.limit || limit,
        offset: data.offset || 0
      };
    } catch (error) {
      return {
        items: [],
        total: 0,
        limit: limit,
        offset: 0,
        error: error.message
      };
    }
  }

  // Recently Played
  async getRecentlyPlayed(limit = 20) {
    try {
      const data = await this.makeSpotifyRequest('/me/player/recently-played', {
        limit
      });
      return {
        items: data.items || [],
        total: data.items ? data.items.length : 0,
        limit: limit
      };
    } catch (error) {
      return {
        items: [],
        total: 0,
        limit: limit,
        error: error.message
      };
    }
  }

  // Currently Playing
  async getCurrentlyPlaying() {
    try {
      const data = await this.makeSpotifyRequest('/me/player/currently-playing');
      return data || { is_playing: false, item: null };
    } catch (error) {
      return { 
        is_playing: false, 
        item: null,
        error: error.message 
      };
    }
  }

  // User Playlists
  async getUserPlaylists(limit = 50) {
    try {
      const data = await this.makeSpotifyRequest('/me/playlists', {
        limit
      });
      return {
        items: data.items || [],
        total: data.total || 0,
        limit: data.limit || limit,
        offset: data.offset || 0
      };
    } catch (error) {
      return {
        items: [],
        total: 0,
        limit: limit,
        offset: 0,
        error: error.message
      };
    }
  }

  // Legacy methods for backward compatibility
  async getTopTrack() {
    try {
      const topTracks = await this.getTopTracks(1);
      return {
        track: topTracks.items[0] || null,
        total: topTracks.total || 0,
        cached: false
      };
    } catch (error) {
      return { 
        track: null, 
        total: 0, 
        error: error.message,
        cached: false
      };
    }
  }

  async getTopPlaylist() {
    try {
      const playlists = await this.getUserPlaylists(1);
      return {
        playlist: playlists.items[0] || null,
        total: playlists.total || 0,
        cached: false
      };
    } catch (error) {
      return { 
        playlist: null, 
        total: 0, 
        error: error.message,
        cached: false 
      };
    }
  }

  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data?.error?.message || error.message,
        statusCode: error.response.status,
        body: error.response.data
      };
    }
    return {
      message: error.message || 'Unknown error occurred',
      statusCode: 500
    };
  }
}

// Export a singleton instance
module.exports = new SpotifyService();