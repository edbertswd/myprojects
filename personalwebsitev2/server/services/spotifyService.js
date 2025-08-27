const SpotifyWebApi = require('spotify-web-api-node');

class SpotifyService {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
    
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpirationEpoch = null;

    // Auto-load tokens from environment variables if available
    if (process.env.SPOTIFY_ACCESS_TOKEN && process.env.SPOTIFY_REFRESH_TOKEN) {
      console.log('🎵 Loading Spotify tokens from environment variables...');
      this.setStoredTokens(process.env.SPOTIFY_ACCESS_TOKEN, process.env.SPOTIFY_REFRESH_TOKEN);
      console.log('✅ Spotify tokens loaded successfully');
    } else {
      console.log('⚠️  No Spotify tokens found in environment variables');
      console.log('📝 Get tokens by visiting: /api/spotify/auth');
    }
  }

  // Generate authorization URL for initial setup
  getAuthUrl() {
    const scopes = ['user-top-read', 'user-read-recently-played', 'playlist-read-private'];
    return this.spotifyApi.createAuthorizeURL(scopes, 'state-key');
  }

  // Set tokens (you'll need to run this once to get your tokens)
  async setTokens(code) {
    try {
      const data = await this.spotifyApi.authorizationCodeGrant(code);
      this.accessToken = data.body.access_token;
      this.refreshToken = data.body.refresh_token;
      this.tokenExpirationEpoch = new Date().getTime() + data.body.expires_in * 1000;
      
      this.spotifyApi.setAccessToken(this.accessToken);
      this.spotifyApi.setRefreshToken(this.refreshToken);
      
      console.log('✅ Spotify tokens set successfully');
      console.log('🔑 Access Token:', this.accessToken);
      console.log('🔄 Refresh Token:', this.refreshToken);
      
      return { success: true, tokens: { accessToken: this.accessToken, refreshToken: this.refreshToken } };
    } catch (error) {
      console.error('❌ Error getting tokens:', error.message);
      throw error;
    }
  }

  // Set tokens directly (for when you have them saved)
  setStoredTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.spotifyApi.setAccessToken(accessToken);
    this.spotifyApi.setRefreshToken(refreshToken);
  }

  // Refresh access token when expired
  async refreshAccessToken() {
    try {
      const data = await this.spotifyApi.refreshAccessToken();
      this.accessToken = data.body.access_token;
      this.tokenExpirationEpoch = new Date().getTime() + data.body.expires_in * 1000;
      
      this.spotifyApi.setAccessToken(this.accessToken);
      console.log('🔄 Access token refreshed');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Error refreshing token:', error.message);
      throw error;
    }
  }

  // Check if token needs refresh
  async ensureValidToken() {
    if (!this.accessToken || !this.refreshToken) {
      throw new Error('No tokens available. Please authenticate first.');
    }

    if (this.tokenExpirationEpoch && new Date().getTime() > this.tokenExpirationEpoch) {
      await this.refreshAccessToken();
    }
  }

  // Get user's top track (most listened song)
  async getTopTrack() {
    await this.ensureValidToken();
    
    try {
      // Get top tracks from different time ranges
      const [shortTerm, mediumTerm, longTerm] = await Promise.all([
        this.spotifyApi.getMyTopTracks({ limit: 1, time_range: 'short_term' }),
        this.spotifyApi.getMyTopTracks({ limit: 1, time_range: 'medium_term' }),
        this.spotifyApi.getMyTopTracks({ limit: 1, time_range: 'long_term' })
      ]);

      // Prefer medium-term (6 months) as most representative
      const topTrack = mediumTerm.body.items[0] || shortTerm.body.items[0] || longTerm.body.items[0];

      if (!topTrack) {
        return { error: 'No top tracks found' };
      }

      return {
        name: topTrack.name,
        artist: topTrack.artists.map(a => a.name).join(', '),
        album: topTrack.album.name,
        albumArt: topTrack.album.images[0]?.url,
        spotifyUrl: topTrack.external_urls.spotify,
        popularity: topTrack.popularity,
        preview_url: topTrack.preview_url,
        timeRange: 'medium_term'
      };
    } catch (error) {
      console.error('Error getting top track:', error.message);
      throw error;
    }
  }

  // Get user's top playlist (most listened to)
  async getTopPlaylist() {
    await this.ensureValidToken();
    
    try {
      // Get user's playlists
      const playlists = await this.spotifyApi.getUserPlaylists({ limit: 50 });
      
      if (!playlists.body.items.length) {
        return { error: 'No playlists found' };
      }

      // For now, we'll return the first playlist with tracks
      // In a real scenario, you'd need to analyze listening history to find the "most listened"
      let topPlaylist = null;
      
      for (const playlist of playlists.body.items) {
        if (playlist.tracks.total > 0) {
          // Get playlist details
          const playlistDetails = await this.spotifyApi.getPlaylist(playlist.id);
          const tracks = await this.spotifyApi.getPlaylistTracks(playlist.id, { limit: 5 });
          
          topPlaylist = {
            name: playlistDetails.body.name,
            description: playlistDetails.body.description,
            image: playlistDetails.body.images[0]?.url,
            trackCount: playlistDetails.body.tracks.total,
            spotifyUrl: playlistDetails.body.external_urls.spotify,
            topTracks: tracks.body.items.map(item => ({
              name: item.track.name,
              artist: item.track.artists.map(a => a.name).join(', '),
              albumArt: item.track.album.images[2]?.url // Smaller image
            }))
          };
          break;
        }
      }

      return topPlaylist || { error: 'No suitable playlist found' };
    } catch (error) {
      console.error('Error getting top playlist:', error.message);
      throw error;
    }
  }
}

module.exports = new SpotifyService();