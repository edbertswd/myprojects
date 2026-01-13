// src/pages/user/UserDashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import ProfilePanel from '../../components/profile/ProfilePanel';
import ApplyManagerModal from './ApplyManagerModal';
import ReviewModal from '../../components/ReviewModal';
import { getManagerApplicationStatus } from '../../services/userApi';
import { getMyBookings } from '../../services/bookingApi';
import {
  Briefcase, CheckCircle, Clock, XCircle, ArrowRight,
  Calendar, DollarSign, Trophy, MapPin, Image as ImageIcon,
  Search, User, Loader2, Star
} from 'lucide-react';

export default function UserHomeDashboard() {
  const navigate = useNavigate();
  const { user, updatePhone } = useAuth();

  // Modals
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingToReview, setSelectedBookingToReview] = useState(null);

  // Manager application status
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Bookings data
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    fetchApplicationStatus();
    fetchBookings();
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      setLoadingStatus(true);
      const response = await getManagerApplicationStatus();
      if (response?.data) {
        setApplicationStatus(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch application status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      setBookingsError(null);
      const data = await getMyBookings({ upcoming: false }); // Get all bookings
      setBookings(data || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setBookingsError('Failed to load bookings. Please try again.');
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleApplicationSuccess = (response) => {
    fetchApplicationStatus();
    alert(response.message || 'Application submitted successfully!');
  };

  const handleOpenReviewModal = (booking) => {
    setSelectedBookingToReview(booking);
    setReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedBookingToReview(null);
  };

  const handleReviewSuccess = () => {
    // Refresh bookings to update review status
    fetchBookings();
    alert('Review submitted successfully! Thank you for your feedback.');
  };

  // Computed values
  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return bookings
      .filter(b => new Date(b.start_time) > now && b.status !== 'cancelled')
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [bookings]);

  const pastBookings = useMemo(() => {
    const now = new Date();
    return bookings
      .filter(b => new Date(b.start_time) <= now || b.status === 'cancelled')
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 5); // Show only recent 5
  }, [bookings]);

  const stats = useMemo(() => {
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const totalSpent = confirmedBookings.reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);

    // Find favorite sport (most frequently booked)
    const sportCounts = {};
    confirmedBookings.forEach(b => {
      const sport = b.sport_name || 'Unknown';
      sportCounts[sport] = (sportCounts[sport] || 0) + 1;
    });
    const favoriteSport = Object.keys(sportCounts).length > 0
      ? Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'None yet';

    return {
      totalBookings: confirmedBookings.length,
      upcomingCount: upcomingBookings.length,
      totalSpent: totalSpent,
      favoriteSport: favoriteSport,
    };
  }, [bookings, upcomingBookings]);

  return (
    <div className="mx-auto max-w-6xl py-8 px-4 space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name || 'there'}!
        </h1>
        <p className="text-gray-600">Here's your booking activity and quick actions</p>
      </div>

      {/* Manager Application Status Banner */}
      {!loadingStatus && applicationStatus && (
        <div className={`rounded-xl border p-4 ${
          applicationStatus.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
          applicationStatus.status === 'approved' ? 'bg-green-50 border-green-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {applicationStatus.status === 'pending' && <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />}
            {applicationStatus.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
            {applicationStatus.status === 'rejected' && <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
            <div className="flex-1">
              <h3 className="font-semibold text-sm">
                {applicationStatus.status === 'pending' && 'Manager Application: Under Review'}
                {applicationStatus.status === 'approved' && 'Manager Application: Approved!'}
                {applicationStatus.status === 'rejected' && 'Manager Application: Rejected'}
              </h3>
              <p className="text-sm mt-1 text-gray-700">
                {applicationStatus.status === 'pending' && `Your application for "${applicationStatus.facility_name}" is being reviewed. We'll notify you within 2-3 business days.`}
                {applicationStatus.status === 'approved' && `Congratulations! Your application for "${applicationStatus.facility_name}" has been approved. You can now access the Manager Dashboard.`}
                {applicationStatus.status === 'rejected' && `Your application for "${applicationStatus.facility_name}" was not approved at this time.`}
              </p>
              {applicationStatus.status === 'approved' && (
                <button
                  onClick={() => navigate('/manager/dashboard')}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Go to Manager Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Summary */}
      {!loadingBookings && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-600 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-gray-900">{stats.upcomingCount}</p>
              </div>
              <Clock className="w-10 h-10 text-green-600 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">${stats.totalSpent.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-600 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Favorite Sport</p>
                <p className="text-xl font-bold text-gray-900 truncate">{stats.favoriteSport}</p>
              </div>
              <Trophy className="w-10 h-10 text-orange-600 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {loadingBookings && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading your bookings...</span>
        </div>
      )}

      {bookingsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-red-700">{bookingsError}</p>
          <button
            onClick={fetchBookings}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Upcoming Bookings */}
      {!loadingBookings && !bookingsError && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Bookings</h2>
            <button
              onClick={() => navigate('/facilities')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Book More
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No upcoming bookings</h3>
              <p className="text-gray-600 mb-6">Ready to get active? Book your next session now!</p>
              <button
                onClick={() => navigate('/facilities')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Facilities
                <Search className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingBookings.map(booking => (
                <BookingCard key={booking.booking_id} booking={booking} navigate={navigate} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Past Bookings */}
      {!loadingBookings && !bookingsError && pastBookings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Past Bookings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastBookings.map(booking => (
              <BookingCard
                key={booking.booking_id}
                booking={booking}
                navigate={navigate}
                isPast={true}
                onReviewClick={handleOpenReviewModal}
              />
            ))}
          </div>
        </section>
      )}

      {/* Become a Manager CTA */}
      {!loadingStatus && !applicationStatus && (
        <section>
          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Own a Sports Facility?
                </h3>
                <p className="text-gray-700 mb-4">
                  List your courts, fields, or sports venues on CourtConnect and start earning from bookings. Join hundreds of facility managers already on our platform.
                </p>
                <button
                  onClick={() => setApplyModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Apply to be a Manager
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/facilities')}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <Search className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Search Facilities</p>
              <p className="text-sm text-gray-600">Find your next court</p>
            </div>
          </button>

          <button
            onClick={() => setProfilePanelOpen(true)}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all group"
          >
            <User className="w-6 h-6 text-gray-600 group-hover:text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Edit Profile</p>
              <p className="text-sm text-gray-600">Update your info</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/facilities')}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
          >
            <MapPin className="w-6 h-6 text-gray-600 group-hover:text-purple-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Nearby Venues</p>
              <p className="text-sm text-gray-600">Explore close by</p>
            </div>
          </button>
        </div>
      </section>

      {/* Modals */}
      <ProfilePanel
        open={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
        initialPhone={user?.phone_number || ''}
        onSaved={(newPhone) => updatePhone(newPhone)}
      />

      <ApplyManagerModal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        onSuccess={handleApplicationSuccess}
      />

      <ReviewModal
        booking={selectedBookingToReview}
        open={reviewModalOpen}
        onClose={handleCloseReviewModal}
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
}

// Booking Card Component
function BookingCard({ booking, navigate, isPast = false, onReviewClick }) {
  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  const now = new Date();

  // Can review if booking is past, confirmed, not cancelled, and hasn't been reviewed yet
  const canReview = isPast && booking.status === 'confirmed' && endTime <= now && !booking.has_reviewed;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Facility Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
        {booking.facility_image_url ? (
          <img
            src={booking.facility_image_url}
            alt={booking.facility_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-gray-400" />
          </div>
        )}
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            booking.status === 'confirmed' ? 'bg-green-500 text-white' :
            booking.status === 'pending' ? 'bg-yellow-500 text-white' :
            'bg-gray-500 text-white'
          }`}>
            {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Confirmed'}
          </span>
        </div>
      </div>

      {/* Booking Details */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
          {booking.facility_name || 'Facility'}
        </h3>
        <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {booking.court_name || booking.sport_type || 'Court'}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{startTime.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-4 h-4 text-green-600" />
            <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span>${parseFloat(booking.total_price || 0).toFixed(2)}</span>
          </div>
        </div>

        {canReview ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReviewClick(booking);
            }}
            className="mt-4 w-full py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4" />
            Leave Review
          </button>
        ) : booking.has_reviewed ? (
          <button
            onClick={() => navigate(`/facility/${booking.facility_id}`)}
            className="mt-4 w-full py-2 bg-green-100 text-green-700 border border-green-300 rounded-lg hover:bg-green-200 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Reviewed
          </button>
        ) : (
          <button
            onClick={() => navigate(`/facility/${booking.facility_id}`)}
            className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 group-hover:gap-3"
          >
            View Details
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
