// src/pages/search/SearchFacilities.jsx
import { useEffect, useMemo, useState } from 'react';
import { Range } from 'react-range';
import api from '../../services/api';
import { useGeolocation, calculateDistance } from '../../hooks/useGeolocation';
import { useSportTypes } from '../../hooks/useSportTypes';

/**
 * Search Facilities — keyword/location, list + filters (with dual price range)
 *
 * Left rail:
 *  - Sport tags
 *  - Price range slider (min..max; dual-handle)
 *  - Locations (multi-checkbox)
 *  - Date picker
 *
 * Right:
 *  - Keyword search bar
 *  - Sort dropdown (New venues / Price desc / Rating)
 *  - Result cards (image, name, location, price, rating, sport chips)
 */

const PRICE_MIN = 0;
const PRICE_MAX = 500;

// Filter vocab
const MAX_DISTANCE_KM = 50; // Maximum distance in kilometers

// Sort options
const SORTS = [
  { value: 'nearest', label: 'Nearest to me' },
  { value: 'new', label: 'New venues' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Rating' },
];

export default function SearchFacilities() {
  // Fetch sport types from API
  const { data: sportTypes } = useSportTypes();
  const ALL_SPORTS = useMemo(() =>
    sportTypes?.map(st => st.sport_name) || [],
    [sportTypes]
  );

  // Geolocation
  const { coordinates, error: locationError, loading: locationLoading, requestLocation } = useGeolocation();

  // Right/top controls
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('nearest');

  // Left rail filters
  const [selectedSports, setSelectedSports] = useState([]); // array of strings
  const [priceMin, setPriceMin] = useState(PRICE_MIN);
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [maxDistance, setMaxDistance] = useState(MAX_DISTANCE_KM); // kilometers

  // Data
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Load data from API
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const params = { page: 1 };
        if (keyword) params.q = keyword;

        const { data } = await api.get('/facilities/search/', { params });

        if (!mounted) return;

        // Handle paginated response
        const results = data.results || data;
        setNextPage(data.next || null);
        setTotalCount(data.count || results.length);
        setCurrentPage(1);

        // Transform backend data to match frontend structure
        const transformed = results.map(f => {
          const facility = {
            id: f.facility_id,
            name: f.facility_name,
            cover: f.image_url || 'https://images.unsplash.com/photo-1542343631-5b6c1b3c0b52?q=80&w=1200&auto=format&fit=crop',
            location: f.address || 'Sydney',
            price: f.min_price || 0,
            rating: f.average_rating || 0,
            sports: f.sports || [],
            isNew: false, // Backend doesn't provide this yet
            availableDates: [], // Backend doesn't provide this yet
            reviewCount: f.review_count || 0,
            latitude: f.latitude,
            longitude: f.longitude,
            timezone: f.timezone || 'Australia/Sydney',
          };

          // Calculate distance if user location is available
          if (coordinates && f.latitude && f.longitude) {
            facility.distance = calculateDistance(
              coordinates.latitude,
              coordinates.longitude,
              parseFloat(f.latitude),
              parseFloat(f.longitude)
            );
          }

          return facility;
        });
        setFacilities(transformed);
      } catch (err) {
        console.error('Failed to fetch facilities:', err);
        if (mounted) setFacilities([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [keyword, coordinates]);

  // Load more facilities
  const loadMore = async () => {
    if (!nextPage || loading) return;

    setLoading(true);
    try {
      const nextPageNum = currentPage + 1;
      const params = { page: nextPageNum };
      if (keyword) params.q = keyword;

      const { data } = await api.get('/facilities/search/', { params });

      // Handle paginated response
      const results = data.results || data;
      setNextPage(data.next || null);
      setCurrentPage(nextPageNum);

      // Transform and append to existing facilities
      const transformed = results.map(f => {
        const facility = {
          id: f.facility_id,
          name: f.facility_name,
          cover: f.image_url || 'https://images.unsplash.com/photo-1542343631-5b6c1b3c0b52?q=80&w=1200&auto=format&fit=crop',
          location: f.address || 'Sydney',
          price: f.min_price || 0,
          rating: f.average_rating || 0,
          sports: f.sports || [],
          isNew: false,
          availableDates: [],
          reviewCount: f.review_count || 0,
          latitude: f.latitude,
          longitude: f.longitude,
          timezone: f.timezone || 'Australia/Sydney',
        };

        // Calculate distance if user location is available
        if (coordinates && f.latitude && f.longitude) {
          facility.distance = calculateDistance(
            coordinates.latitude,
            coordinates.longitude,
            parseFloat(f.latitude),
            parseFloat(f.longitude)
          );
        }

        return facility;
      });

      setFacilities(prev => [...prev, ...transformed]);
    } catch (err) {
      console.error('Failed to load more facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const toggleArrayItem = (arr, setArr, value) => {
    setArr((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  // Filtering + sorting (client side)
  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    let list = facilities.filter((f) => {
      // Keyword hits name or location
      const hitQ = !q || f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q);
      if (!hitQ) return false;

      // Sports: any selected
      const hitSport = selectedSports.length === 0 || selectedSports.some((s) => f.sports.includes(s));
      if (!hitSport) return false;

      // Price within [priceMin, priceMax]
      if (f.price < priceMin || f.price > priceMax) return false;

      // Distance filter (only applies if user location is available)
      if (coordinates && f.distance !== undefined && f.distance > maxDistance) {
        return false;
      }

      return true;
    });

    // Sort
    switch (sort) {
      case 'nearest':
        list = list.slice().sort((a, b) => {
          // Facilities with distance come first, sorted by distance
          if (a.distance !== undefined && b.distance === undefined) return -1;
          if (a.distance === undefined && b.distance !== undefined) return 1;
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          // If no distance available, sort by rating
          return b.rating - a.rating;
        });
        break;
      case 'price_desc':
        list = list.slice().sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list = list.slice().sort((a, b) => b.rating - a.rating);
        break;
      case 'new':
      default:
        list = list.slice().sort((a, b) => {
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return b.rating - a.rating;
        });
        break;
    }
    return list;
  }, [facilities, keyword, selectedSports, priceMin, priceMax, maxDistance, coordinates, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Location permission banner */}
      {!coordinates && !locationError && (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Find facilities near you</h3>
              <p className="text-sm text-blue-700">
                Share your location to see facilities sorted by distance and view times in your timezone
              </p>
            </div>
            <button
              onClick={requestLocation}
              disabled={locationLoading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {locationLoading ? 'Getting location...' : 'Share Location'}
            </button>
          </div>
        </div>
      )}

      {/* Location error banner */}
      {locationError && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-amber-600">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-amber-800">{locationError}</p>
              <button
                onClick={requestLocation}
                className="mt-2 text-sm text-amber-700 underline hover:text-amber-900"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location granted banner */}
      {coordinates && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <span>✓</span>
            <span>Showing facilities near your location</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: filters */}
        <aside className="lg:col-span-3">
          <div className="rounded-2xl border p-4 space-y-6">
            <h2 className="text-lg font-semibold">Filters</h2>

            {/* Sport tags */}
            <div>
              <div className="text-sm font-medium mb-2">Sport type</div>
              <div className="flex flex-wrap gap-2">
                {ALL_SPORTS.map((s) => {
                  const active = selectedSports.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleArrayItem(selectedSports, setSelectedSports, s)}
                      className={
                        'rounded-full border px-3 py-1 text-sm ' +
                        (active ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50')
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price slider (dual-thumb in one line) */}
            <div>
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Price (per hour)</div>
                <div className="text-sm text-gray-600">${priceMin} – ${priceMax}</div>
            </div>

            <Range
                values={[priceMin, priceMax]}
                step={5}
                min={PRICE_MIN}
                max={PRICE_MAX}
                onChange={(values) => {
                setPriceMin(values[0]);
                setPriceMax(values[1]);
                }}
                renderTrack={({ props, children }) => (
                <div
                    {...props}
                    className="h-2 w-full rounded bg-gray-200"
                >
                    {children}
                </div>
                )}
                renderThumb={({ props }) => (
                <div
                    {...props}
                    className="h-4 w-4 rounded-full bg-blue-600 shadow"
                />
                )}
            />

            {/* Optional numeric inputs under the slider */}
            <div className="mt-2 flex items-center gap-2">
                <input
                type="number"
                value={priceMin}
                min={PRICE_MIN}
                max={priceMax}
                step={5}
                onChange={(e) => setPriceMin(Number(e.target.value))}
                className="w-24 rounded-xl border px-3 py-2 text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                type="number"
                value={priceMax}
                min={priceMin}
                max={PRICE_MAX}
                step={5}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-24 rounded-xl border px-3 py-2 text-sm"
                />
            </div>
            </div>

            {/* Distance slider */}
            {coordinates ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Maximum distance</div>
                  <div className="text-sm text-gray-600">{maxDistance} km</div>
                </div>
                <input
                  type="range"
                  min="1"
                  max={MAX_DISTANCE_KM}
                  step="1"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 km</span>
                  <span>{MAX_DISTANCE_KM} km</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
                Share your location to filter by distance
              </div>
            )}

            {/* Reset filters */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSports([]);
                  setPriceMin(PRICE_MIN);
                  setPriceMax(PRICE_MAX);
                  setMaxDistance(MAX_DISTANCE_KM);
                }}
                className="rounded-xl border px-3 py-2 text-sm"
              >
                Reset filters
              </button>
            </div>
          </div>
        </aside>

        {/* Right: search + sort + results */}
        <section className="lg:col-span-9">
          {/* Top controls */}
          <div className="rounded-2xl border p-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              {/* Keyword search */}
              <div className="flex-1">
                <label className="sr-only" htmlFor="kw">Search</label>
                <input
                  id="kw"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search by venue name or area…"
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-xl border px-3 py-2"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading && (
              <div className="col-span-full rounded-2xl border p-4 opacity-70">Loading…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border p-4 opacity-70">
                No facilities match your filters.
              </div>
            )}

            {!loading && filtered.map((f) => (
              <article key={f.id} className="rounded-2xl border overflow-hidden">
                <div className="aspect-video bg-gray-100">
                  <img src={f.cover} alt={f.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-semibold">{f.name}</h3>
                    {f.isNew && (
                      <span className="ml-2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-xs">
                        New
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{f.location}</div>
                  {f.distance !== undefined && (
                    <div className="text-sm text-blue-600 font-medium">
                      📍 {f.distance.toFixed(1)} km away
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-semibold">${f.price}</span> / hour
                  </div>
                  {/* Rating with review count */}
                  <div className="flex items-center gap-2 text-sm">
                    <span>⭐ {f.rating > 0 ? f.rating.toFixed(1) : '0.0'}</span>
                    {f.reviewCount > 0 && (
                      <span className="text-gray-500">({f.reviewCount} {f.reviewCount === 1 ? 'review' : 'reviews'})</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {f.sports.map((s) => (
                      <span key={s} className="rounded-full border px-2 py-0.5 text-xs">{s}</span>
                    ))}
                  </div>

                  {/* CTA to facility detail page */}
                  <div className="pt-2">
                    <a
                      href={`/facility/${f.id}`}
                      className="inline-block rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      View details
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Load More button and pagination info */}
          {!loading && filtered.length > 0 && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="text-sm text-gray-600">
                Showing {filtered.length} of {totalCount} facilities
              </div>
              {nextPage && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
