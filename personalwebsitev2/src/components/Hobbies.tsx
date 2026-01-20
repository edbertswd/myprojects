import React, { useState, useEffect } from 'react';
import { Music, Play, Users, TrendingUp, Zap, Star, Trophy, Eye, Clock, BarChart3 } from 'lucide-react';

interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumArt?: string;
  spotifyUrl: string;
  popularity: number;
  preview_url?: string;
}

interface SpotifyArtist {
  name: string;
  genres: string[];
  popularity: number;
  followers: { total: number };
  images: { url: string }[];
  external_urls: { spotify: string };
}

interface SpotifyPlaylist {
  name: string;
  description?: string;
  image?: string;
  trackCount: number;
  spotifyUrl: string;
  topTracks: {
    name: string;
    artist: string;
    albumArt?: string;
  }[];
}

interface RecentTrack {
  track: SpotifyTrack & { played_at: string };
}

interface ListeningStats {
  period: string;
  totalTracks: number;
  totalArtists: number;
  topGenres: { genre: string; count: number }[];
  averagePopularity: number;
  diversityScore: number;
}


interface PokemonCard {
  id: string;
  name: string;
  rarity?: string;
  set: {
    name: string;
    series: string;
  };
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    prices?: {
      holofoil?: { market: number };
      normal?: { market: number };
    };
  };
  types?: string[];
  quantity?: number;
}

interface HobbiesData {
  spotify: {
    topTrack?: SpotifyTrack;
    topPlaylist?: SpotifyPlaylist;
    topTracks?: SpotifyTrack[];
    topArtists?: SpotifyArtist[];
    recentTracks?: RecentTrack[];
    currentPlaying?: any;
    weeklyStats?: ListeningStats;
    monthlyStats?: ListeningStats;
  };
  pokemon: {
    featured: PokemonCard[];
    stats: {
      totalCards: number;
      uniqueCards: number;
      totalValue: number;
      rarityBreakdown: Record<string, number>;
    };
  };
}

const Hobbies = () => {
  const [data, setData] = useState<HobbiesData>({
    spotify: {},
    pokemon: { featured: [], stats: { totalCards: 0, uniqueCards: 0, totalValue: 0, rarityBreakdown: {} } }
  });
  const [loading, setLoading] = useState(true);
  const [spotifyLoading, setSpotifyLoading] = useState(true);
  const [pokemonLoading, setPokemonLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spotifyTab, setSpotifyTab] = useState<'overview' | 'stats'>('overview');

  const fetchHobbiesData = async () => {
    try {
      setLoading(true);
      
      const getApiBase = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:3001/api';
        }
        return '/api';
      };

      const API_BASE = getApiBase();

      // Check if backend is available
      const checkBackendHealth = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1000);
          const response = await fetch(`${API_BASE}/health`, { signal: controller.signal });
          clearTimeout(timeoutId);
          return response.ok;
        } catch {
          return false;
        }
      };

      const backendAvailable = await checkBackendHealth();

      let spotifyResponse = { ok: false } as Response;
      let spotifyTopTracksResponse = { ok: false } as Response;
      let spotifyTopArtistsResponse = { ok: false } as Response;
      let spotifyRecentResponse = { ok: false } as Response;
      let pokemonResponse = { ok: false } as Response;
      let pokemonStatsResponse = { ok: false } as Response;

      // Only fetch if backend is available to avoid console errors
      if (backendAvailable) {
        [
          spotifyResponse,
          spotifyTopTracksResponse,
          spotifyTopArtistsResponse,
          spotifyRecentResponse,
          pokemonResponse,
          pokemonStatsResponse
        ] = await Promise.all([
          fetch(`${API_BASE}/spotify/dashboard`).catch(() => ({ ok: false } as Response)),
          fetch(`${API_BASE}/spotify/top-tracks?limit=10`).catch(() => ({ ok: false } as Response)),
          fetch(`${API_BASE}/spotify/top-artists?limit=10`).catch(() => ({ ok: false } as Response)),
          fetch(`${API_BASE}/spotify/recently-played?limit=20`).catch(() => ({ ok: false } as Response)),
          fetch(`${API_BASE}/pokemon/featured?limit=6`).catch(() => ({ ok: false } as Response)),
          fetch(`${API_BASE}/pokemon/stats`).catch(() => ({ ok: false } as Response))
        ]);
      }

      const newData: HobbiesData = {
        spotify: {},
        pokemon: { featured: [], stats: { totalCards: 0, uniqueCards: 0, totalValue: 0, rarityBreakdown: {} } }
      };

      // Process Spotify dashboard
      if (spotifyResponse.ok) {
        try {
          const spotifyData = await spotifyResponse.json();
          
          newData.spotify = {
            topTrack: (spotifyData?.topTrack?.track && !spotifyData.topTrack.error) ? {
              name: spotifyData.topTrack.track.name,
              artist: spotifyData.topTrack.track.artists?.[0]?.name || 'Unknown Artist',
              album: spotifyData.topTrack.track.album?.name || 'Unknown Album',
              albumArt: spotifyData.topTrack.track.album?.images?.[0]?.url,
              spotifyUrl: spotifyData.topTrack.track.external_urls?.spotify || '#',
              popularity: spotifyData.topTrack.track.popularity || 0,
              preview_url: spotifyData.topTrack.track.preview_url
            } : undefined,
            topPlaylist: (spotifyData?.topPlaylist?.playlist && !spotifyData.topPlaylist.error) ? {
              name: spotifyData.topPlaylist.playlist.name,
              description: spotifyData.topPlaylist.playlist.description,
              image: spotifyData.topPlaylist.playlist.images?.[0]?.url,
              trackCount: spotifyData.topPlaylist.playlist.tracks?.total || 0,
              spotifyUrl: spotifyData.topPlaylist.playlist.external_urls?.spotify || '#',
              topTracks: []
            } : undefined
          };
        } catch (jsonError) {
          // Silently handle JSON parse error
        }
      }

      // Process top tracks
      if (spotifyTopTracksResponse.ok) {
        try {
          const topTracksData = await spotifyTopTracksResponse.json();
          if (Array.isArray(topTracksData.items)) {
            newData.spotify.topTracks = topTracksData.items.map((track: any) => ({
              name: track.name,
              artist: track.artists?.[0]?.name || 'Unknown Artist',
              album: track.album?.name || 'Unknown Album',
              albumArt: track.album?.images?.[0]?.url,
              spotifyUrl: track.external_urls?.spotify || '#',
              popularity: track.popularity || 0
            }));
          }
        } catch (jsonError) {
          // Silently handle JSON parse error
        }
      }

      // Process top artists
      if (spotifyTopArtistsResponse.ok) {
        try {
          const topArtistsData = await spotifyTopArtistsResponse.json();
          if (Array.isArray(topArtistsData.items)) {
            newData.spotify.topArtists = topArtistsData.items.map((artist: any) => ({
              name: artist.name,
              genres: artist.genres || [],
              popularity: artist.popularity || 0,
              followers: artist.followers || { total: 0 },
              images: artist.images || [],
              external_urls: artist.external_urls || { spotify: '#' }
            }));

            // Generate listening stats from available data
            const genres = newData.spotify.topArtists.flatMap(artist => artist.genres);
            const genreCount = genres.reduce((acc: Record<string, number>, genre) => {
              acc[genre] = (acc[genre] || 0) + 1;
              return acc;
            }, {});

            newData.spotify.monthlyStats = {
              period: 'Monthly',
              totalTracks: newData.spotify.topTracks?.length || 0,
              totalArtists: newData.spotify.topArtists.length,
              topGenres: Object.entries(genreCount).map(([genre, count]) => ({ genre, count }))
                .sort((a, b) => b.count - a.count).slice(0, 5),
              averagePopularity: newData.spotify.topTracks ? 
                newData.spotify.topTracks.reduce((sum, track) => sum + track.popularity, 0) / newData.spotify.topTracks.length : 0,
              diversityScore: Math.min(100, Object.keys(genreCount).length * 5)
            };
          }
        } catch (jsonError) {
          // Silently handle JSON parse error
        }
      }

      // Process recent tracks
      if (spotifyRecentResponse.ok) {
        try {
          const recentData = await spotifyRecentResponse.json();
          if (Array.isArray(recentData.items)) {
            newData.spotify.recentTracks = recentData.items.map((item: any) => ({
              track: {
                name: item.track?.name || 'Unknown Track',
                artist: item.track?.artists?.[0]?.name || 'Unknown Artist',
                album: item.track?.album?.name || 'Unknown Album',
                albumArt: item.track?.album?.images?.[0]?.url,
                spotifyUrl: item.track?.external_urls?.spotify || '#',
                popularity: item.track?.popularity || 0,
                played_at: item.played_at
              }
            }));

          }
        } catch (jsonError) {
          // Silently handle JSON parse error
        }
      }

      // Process Pokemon data
      if (pokemonResponse.ok) {
        try {
          const pokemonData = await pokemonResponse.json();
          newData.pokemon.featured = Array.isArray(pokemonData?.cards) ? pokemonData.cards : [];
        } catch (jsonError) {
          newData.pokemon.featured = [];
        }
      }

      if (pokemonStatsResponse.ok) {
        try {
          const statsData = await pokemonStatsResponse.json();
          newData.pokemon.stats = {
            totalCards: statsData?.totalCards || 0,
            uniqueCards: statsData?.uniqueCards || 0,
            totalValue: statsData?.totalValue || 0,
            rarityBreakdown: statsData?.rarityBreakdown || {}
          };
        } catch (jsonError) {
          // Silently handle JSON parse error
        }
      }

      setData(newData);
      setError(null);
    } catch (err) {
      // Silently handle error - backend may not be running
      setError(err instanceof Error ? err.message : 'Failed to fetch hobbies data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHobbiesData();
    const interval = setInterval(fetchHobbiesData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'common': return 'bg-gray-500';
      case 'uncommon': return 'bg-green-500';
      case 'rare': return 'bg-blue-500';
      case 'ultra rare': return 'bg-purple-500';
      case 'secret rare': return 'bg-yellow-500';
      case 'rainbow rare': return 'bg-gradient-to-r from-red-500 to-purple-500';
      default: return 'bg-gray-400';
    }
  };


  if (loading) {
    return (
      <section className="py-12" style={{ backgroundColor: "#effcf5" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">My Hobbies</h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="hobbies" className="py-12" style={{ backgroundColor: "#effcf5" }}>
      <div className="max-w-6xl mx-auto px-4">
        
        <div className="text-center mb-8">
          <div 
            className="inline-block px-4 py-2 mb-4 rounded-lg"
            style={{
              background: "linear-gradient(45deg, hsl(var(--sage)), hsl(var(--primary)))",
              border: "1px solid hsl(var(--sage))",
              color: "#fff"
            }}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">PERSONAL INTERESTS</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Hobbies</h2>
          <p className="text-gray-600">What's a man without a hobby?</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-center">
              {error} - Backend may not be running
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Enhanced Spotify Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ border: "1px solid hsl(var(--sage))" }}>
            <div 
              className="px-6 py-4"
              style={{
                background: "linear-gradient(135deg, #1db954 0%, #1ed760 100%)",
                color: "white"
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5" />
                  <h3 className="text-lg font-bold">Spotify Analytics</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSpotifyTab('overview')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      spotifyTab === 'overview' ? 'bg-white bg-opacity-30' : 'bg-white bg-opacity-10 hover:bg-opacity-20'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setSpotifyTab('stats')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      spotifyTab === 'stats' ? 'bg-white bg-opacity-30' : 'bg-white bg-opacity-10 hover:bg-opacity-20'
                    }`}
                  >
                    Stats
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {spotifyTab === 'overview' && (
                <div className="space-y-6">
                  {data.spotify.topTrack ? (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Most Played Song</h4>
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        {data.spotify.topTrack.albumArt && (
                          <img 
                            src={data.spotify.topTrack.albumArt} 
                            alt={data.spotify.topTrack.album}
                            className="w-16 h-16 rounded-lg shadow-md"
                          />
                        )}
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-800">{data.spotify.topTrack.name}</h5>
                          <p className="text-gray-600 text-sm">{data.spotify.topTrack.artist}</p>
                          <p className="text-gray-500 text-xs">{data.spotify.topTrack.album}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-gray-500">{data.spotify.topTrack.popularity}% popularity</span>
                          </div>
                        </div>
                        <a 
                          href={data.spotify.topTrack.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium hover:bg-green-600 transition-colors"
                        >
                          <Play className="w-3 h-3" /> Play
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                      <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Spotify data not available</p>
                    </div>
                  )}

                  {data.spotify.recentTracks && data.spotify.recentTracks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Recently Played
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {data.spotify.recentTracks.slice(0, 8).map((item, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                            {item.track.albumArt && (
                              <img 
                                src={item.track.albumArt} 
                                alt={item.track.album}
                                className="w-8 h-8 rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{item.track.name}</p>
                              <p className="text-xs text-gray-500 truncate">{item.track.artist}</p>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(item.track.played_at).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {spotifyTab === 'stats' && (
                <div className="space-y-6">
                  {data.spotify.monthlyStats && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="w-3 h-3" /> Monthly Stats
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-800">{data.spotify.monthlyStats.totalTracks}</div>
                          <div className="text-xs text-gray-500">Top Tracks</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-800">{data.spotify.monthlyStats.totalArtists}</div>
                          <div className="text-xs text-gray-500">Top Artists</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-800">{data.spotify.monthlyStats.averagePopularity.toFixed(0)}%</div>
                          <div className="text-xs text-gray-500">Avg Popularity</div>
                        </div>
                      </div>

                      {data.spotify.monthlyStats.topGenres.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-2">Top Genres:</p>
                          <div className="flex flex-wrap gap-2">
                            {data.spotify.monthlyStats.topGenres.map((genre, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                              >
                                {genre.genre} ({genre.count})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {data.spotify.topTracks && data.spotify.topTracks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Top Tracks</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {data.spotify.topTracks.slice(0, 8).map((track, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                            <span className="w-6 text-center text-xs text-gray-400">#{index + 1}</span>
                            {track.albumArt && (
                              <img 
                                src={track.albumArt} 
                                alt={track.album}
                                className="w-8 h-8 rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{track.name}</p>
                              <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                            </div>
                            <span className="text-xs text-gray-400">{track.popularity}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Pokemon Cards Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ border: "1px solid hsl(var(--sage))" }}>
            <div 
              className="px-6 py-4"
              style={{
                background: "linear-gradient(135deg, hsl(var(--sage)) 0%, hsl(var(--primary)) 100%)",
                color: "white"
              }}
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5" />
                <h3 className="text-lg font-bold">Pokémon Card Collection</h3>
              </div>
            </div>

            <div className="p-6">
              {/* Collection Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-800">{data.pokemon.stats.totalCards}</div>
                  <div className="text-xs text-gray-500">Total Cards</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-800">{data.pokemon.stats.uniqueCards}</div>
                  <div className="text-xs text-gray-500">Unique Cards</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-800">${data.pokemon.stats.totalValue.toFixed(0)}</div>
                  <div className="text-xs text-gray-500">Est. Value</div>
                </div>
              </div>

              {/* Featured Cards */}
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Star className="w-3 h-3" /> Featured Cards
                </h4>
                
                {Array.isArray(data.pokemon.featured) && data.pokemon.featured.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {data.pokemon.featured.map((card, index) => (
                      <div key={card.id || index} className="group cursor-pointer">
                        <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-105">
                          <img 
                            src={card.images?.small || ''} 
                            alt={card.name || 'Pokemon Card'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-card.png';
                            }}
                          />
                          {card.rarity && (
                            <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium text-white ${getRarityColor(card.rarity)}`}>
                              {card.rarity}
                            </div>
                          )}
                          {card.quantity && card.quantity > 1 && (
                            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-bold">
                              ×{card.quantity}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-end">
                            <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <h5 className="font-semibold text-sm">{card.name || 'Unknown Card'}</h5>
                              <p className="text-xs opacity-90">{card.set?.name || 'Unknown Set'}</p>
                              {card.tcgplayer?.prices && (
                                <p className="text-xs font-medium mt-1">
                                  ${(card.tcgplayer.prices.holofoil?.market || card.tcgplayer.prices.normal?.market || 0).toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No Pokemon cards found</p>
                    <p className="text-xs mt-1">Pokemon API not working...</p>
                    <div className="mt-2 text-xs">
                      <div>/api/pokemon/featured</div>
                      <div>/api/pokemon/stats</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hobbies;