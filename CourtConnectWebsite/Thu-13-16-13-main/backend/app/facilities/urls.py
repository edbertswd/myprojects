from django.urls import path
from . import views
from . import reviews_views

app_name = 'facilities'

urlpatterns = [
    # Facility endpoints
    path('', views.FacilityListView.as_view(), name='facility-list'),
    path('search/', views.facility_search_view, name='facility-search'),
    path('<int:facility_id>/', views.FacilityDetailView.as_view(), name='facility-detail'),
    path('create/', views.FacilityCreateView.as_view(), name='facility-create'),
    path('<int:facility_id>/update/', views.FacilityUpdateView.as_view(), name='facility-update'),

    # Court endpoints
    path('<int:facility_id>/courts/', views.CourtListView.as_view(), name='court-list'),
    path('courts/<int:court_id>/', views.CourtDetailView.as_view(), name='court-detail'),
    path('courts/<int:court_id>/availability/', views.AvailabilityListView.as_view(), name='availability-list'),

    # Sport types
    path('sport-types/', views.SportTypeListView.as_view(), name='sport-type-list'),

    # Review endpoints
    path('reviews/', reviews_views.CreateReviewView.as_view(), name='create-review'),
    path('<int:facility_id>/reviews/', reviews_views.FacilityReviewsListView.as_view(), name='facility-reviews'),
    path('reviews/<int:review_id>/', reviews_views.UpdateReviewView.as_view(), name='update-review'),
    path('bookings/<int:booking_id>/review-status/', reviews_views.check_booking_reviewed, name='booking-review-status'),
    path('my-reviews/', reviews_views.get_user_reviews, name='my-reviews'),
]