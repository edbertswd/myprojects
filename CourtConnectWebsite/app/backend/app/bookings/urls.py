from django.urls import path
from . import views
from . import reservation_views

app_name = 'bookings'

urlpatterns = [
    # Booking CRUD endpoints
    path('v1/', views.CreateBookingView.as_view(), name='create-booking'),
    path('v1/<int:booking_id>/', views.BookingDetailView.as_view(), name='booking-detail'),
    path('v1/<int:booking_id>/cancel/', views.CancelBookingView.as_view(), name='cancel-booking'),

    # User booking management
    path('v1/my-bookings/', views.MyBookingsListView.as_view(), name='my-bookings'),
    path('v1/stats/', views.booking_stats_view, name='booking-stats'),

    # Temporary reservations
    path('v1/reservations/', reservation_views.CreateReservationView.as_view(), name='create-reservation'),
    path('v1/reservations/active/', reservation_views.get_active_reservation, name='active-reservation'),
    path('v1/reservations/<int:reservation_id>/', reservation_views.ReservationDetailView.as_view(), name='reservation-detail'),
]