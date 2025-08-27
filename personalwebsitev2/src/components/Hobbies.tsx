import React, { useState, useEffect } from 'react';
import { Music, Play, Users, TrendingUp, Zap, Star, Trophy, Eye } from 'lucide-react';

interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumArt?: string;
  spotifyUrl: string;
  popularity: number;
  preview_url?: string;
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
  const [error, setError] = useState<string | null>(null);

  const fetchHobbiesData = async () => {
    try {
      setLoading(true);
      
      // Use environment-appropriate API base URL
      const API_BASE = process.env.NODE_ENV === 'production' 
        ? 'https://edbertsuwandi.com/api' 
        : 'http://localhost:3001/api';
      
      // Fetch Spotify and Pokemon data in parallel
      const [spotifyResponse, pokemonResponse, pokemonStatsResponse] = await Promise.all([
        fetch(`${API_BASE}/spotify/dashboard`).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/pokemon/featured?limit=6`).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/pokemon/stats`).catch(() => ({ ok: false }))
      ]);

      const newData: HobbiesData = {
        spotify: {},
        pokemon: { featured: [], stats: { totalCards: 0, uniqueCards: 0, totalValue: 0, rarityBreakdown: {} } }
      };

      // Process Spotify data
      if (spotifyResponse.ok) {
        const spotifyData = await spotifyResponse.json();
        newData.spotify = {
          topTrack: spotifyData.topTrack?.error ? undefined : spotifyData.topTrack,
          topPlaylist: spotifyData.topPlaylist?.error ? undefined : spotifyData.topPlaylist
        };
      }

      // Process Pokemon data
      if (pokemonResponse.ok) {
        const pokemonData = await pokemonResponse.json();
        newData.pokemon.featured = pokemonData.cards || [];
      }

      if (pokemonStatsResponse.ok) {
        const statsData = await pokemonStatsResponse.json();
        newData.pokemon.stats = statsData;
      }

      setData(newData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch hobbies data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHobbiesData();
    
    // Set up auto-refresh every 30 seconds
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
            {/* Spotify Loading Skeleton */}
            <div className="bg-white rounded-xl p-6 shadow-md animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
            
            {/* Pokemon Loading Skeleton */}
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
        
        {/* Header */}
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
          
          {/* Spotify Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ border: "1px solid hsl(var(--sage))" }}>
            <div 
              className="px-6 py-4"
              style={{
                background: "linear-gradient(135deg, #1db954 0%, #1ed760 100%)", // Spotify green
                color: "white"
              }}
            >
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5" />
                <h3 className="text-lg font-bold">Current Music Obsession</h3>
              </div>
            </div>

            <div className="p-6">
              {data.spotify.topTrack ? (
                <div className="mb-6">
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
                <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                  <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Spotify data not available</p>
                </div>
              )}

              {data.spotify.topPlaylist && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Favorite Playlist</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-4 mb-3">
                      {data.spotify.topPlaylist.image && (
                        <img 
                          src={data.spotify.topPlaylist.image} 
                          alt={data.spotify.topPlaylist.name}
                          className="w-12 h-12 rounded-lg shadow-md"
                        />
                      )}
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-800">{data.spotify.topPlaylist.name}</h5>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Users className="w-3 h-3" />
                          <span>{data.spotify.topPlaylist.trackCount} tracks</span>
                        </div>
                      </div>
                      <a 
                        href={data.spotify.topPlaylist.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium hover:bg-green-600 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> View
                      </a>
                    </div>
                    
                    {data.spotify.topPlaylist.topTracks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600">Recent tracks:</p>
                        {data.spotify.topPlaylist.topTracks.slice(0, 3).map((track, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="w-4 text-center">{index + 1}</span>
                            <span className="flex-1 truncate">{track.name}</span>
                            <span className="text-gray-500">{track.artist}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                
                {data.pokemon.featured.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {data.pokemon.featured.map((card, index) => (
                      <div key={card.id} className="group cursor-pointer">
                        <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-105">
                          <img 
                            src={card.images.small} 
                            alt={card.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          
                          {/* Rarity indicator */}
                          {card.rarity && (
                            <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium text-white ${getRarityColor(card.rarity)}`}>
                              {card.rarity}
                            </div>
                          )}
                          
                          {/* Quantity badge */}
                          {card.quantity && card.quantity > 1 && (
                            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-bold">
                              ×{card.quantity}
                            </div>
                          )}

                          {/* Card info overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-end">
                            <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <h5 className="font-semibold text-sm">{card.name}</h5>
                              <p className="text-xs opacity-90">{card.set.name}</p>
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
                    <p className="text-sm">No cards available</p>
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