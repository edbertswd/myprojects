// src/pages/facilities/FacilityDetail.jsx
import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getFacilityReviews } from '../../services/reviewApi';

/**
 * Facility Detail (Venue page)
 * - Left: hero image
 * - Right: name, "Book" chip, address, timezone
 * - Bottom: Courts available at this facility
 */

export default function FacilityDetail() {
  const { id } = useParams(); // e.g. /facility/:id
  const navigate = useNavigate();

  // State for facility + courts
  const [facility, setFacility] = useState(null);
  const [courts, setCourts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Load data from API
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch facility details
        const { data: facilityData } = await api.get(`/facilities/${id}/`);
        if (mounted) setFacility(facilityData);

        // Fetch courts for this facility
        const { data: courtsData } = await api.get(`/facilities/${id}/courts/`);
        if (mounted) setCourts(courtsData || []);

        // Fetch reviews for this facility
        setLoadingReviews(true);
        try {
          const reviewsData = await getFacilityReviews(id);
          if (mounted) setReviews(reviewsData || []);
        } catch (reviewErr) {
          console.error('Failed to fetch reviews:', reviewErr);
          // Don't block the page if reviews fail to load
        } finally {
          if (mounted) setLoadingReviews(false);
        }
      } catch (err) {
        console.error('Failed to fetch facility:', err);
        if (mounted) setError('Failed to load facility details');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Extract unique sport types from courts
  const uniqueSportTypes = useMemo(() => {
    const sportMap = new Map();
    courts.forEach(court => {
      if (!sportMap.has(court.sport_name)) {
        sportMap.set(court.sport_name, {
          name: court.sport_name,
          sportTypeId: court.sport_type
        });
      }
    });
    return Array.from(sportMap.values());
  }, [courts]);

  if (loading) {
    return <div className="mx-auto max-w-6xl p-6">Loading facility details…</div>;
  }

  if (error || !facility) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error || 'Facility not found'}
        </div>
        <button
          onClick={() => navigate('/facilities')}
          className="mt-4 rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          Back to Facilities
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Top section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: facility image placeholder */}
        <div className="md:col-span-7">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border bg-gray-100 flex items-center justify-center">
            <div className="text-center p-8">
              <h2 className="text-2xl font-semibold text-gray-400">
                {facility.facility_name}
              </h2>
              <p className="text-gray-500 mt-2">Facility Image</p>
            </div>
          </div>
        </div>

        {/* Right: facility info */}
        <div className="md:col-span-5">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold">{facility.facility_name}</h1>
            {facility.is_active && (
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 text-xs font-medium">
                Active
              </span>
            )}

            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Address:</span> {facility.address}
              </div>
              <div className="text-sm">
                <span className="font-medium">Timezone:</span> {facility.timezone}
              </div>
              {facility.manager_name && (
                <div className="text-sm">
                  <span className="font-medium">Manager:</span> {facility.manager_name}
                </div>
              )}
            </div>

            {facility.latitude && facility.longitude && (
              <div className="text-xs text-gray-400 pt-2">
                Coordinates: {facility.latitude}, {facility.longitude}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sport Selection Section */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Select a Sport to Book</h2>
        {courts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No courts available at this facility
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {uniqueSportTypes.map((sport) => {
              const sportCourts = courts.filter(c => c.sport_name === sport.name);
              const minRate = Math.min(...sportCourts.map(c => c.hourly_rate));

              return (
                <div key={sport.name} className="rounded-2xl border p-6 hover:border-gray-400 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{sport.name}</h3>
                    <div className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
                      {sportCourts.length} {sportCourts.length === 1 ? 'court' : 'courts'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    <div className="text-lg font-semibold text-gray-900">
                      From ${minRate}/hour
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/choose?facility=${facility.facility_id}&sport=${encodeURIComponent(sport.name)}`)}
                    className="w-full rounded-xl bg-gray-900 text-white px-4 py-2 hover:bg-black text-sm font-medium"
                  >
                    Book {sport.name}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reviews Section */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Reviews & Ratings</h2>
            {facility.review_count > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <StarRating value={Math.round(facility.average_rating || 0)} />
                <span className="text-lg font-semibold">{facility.average_rating?.toFixed(1)}</span>
                <span className="text-sm text-gray-500">
                  ({facility.review_count} {facility.review_count === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>
        </div>

        {loadingReviews ? (
          <div className="text-center py-8 text-gray-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed">
            <p className="text-gray-500">No reviews yet. Be the first to review this facility!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <ReviewCard key={review.review_id} review={review} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <article className="rounded-2xl border p-4">
      <div className="flex items-center justify-between mb-3">
        <StarRating value={review.rating} />
        <span className="text-sm text-gray-500">
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
      )}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-600">
            {review.user_name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div className="text-sm">
          <div className="text-gray-900 font-medium">{review.user_name || 'Anonymous'}</div>
        </div>
      </div>
    </article>
  );
}

function StarRating({ value = 0, outOf = 5 }) {
  const stars = Array.from({ length: outOf }, (_, i) => i < value);
  return (
    <div className="flex">
      {stars.map((on, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-4 w-4 ${on ? 'text-yellow-500' : 'text-gray-300'}`}
          fill="currentColor"
        >
          <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.564-.954L10 0l2.948 5.956 6.564.954-4.756 4.635 1.122 6.545z" />
        </svg>
      ))}
    </div>
  );
}
