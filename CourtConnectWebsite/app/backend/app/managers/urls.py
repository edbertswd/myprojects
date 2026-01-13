from django.urls import path
from . import views

app_name = 'managers'

urlpatterns = [
    # Manager dashboard
    path('overview/', views.manager_overview_view, name='manager-overview'),

    # Manager facility management
    path('facilities/', views.ManagerFacilityListView.as_view(), name='manager-facilities-list'),
    path('facilities/<int:facility_id>/', views.ManagerFacilityDetailView.as_view(), name='manager-facility-detail'),

    # Manager court management
    path('facilities/<int:facility_id>/courts/', views.manager_facility_courts_view, name='manager-facility-courts'),
    path('facilities/<int:facility_id>/courts/create/', views.manager_create_court_view, name='manager-create-court'),
    path('facilities/<int:facility_id>/courts/<int:court_id>/', views.manager_update_court_view, name='manager-update-court'),
    path('facilities/<int:facility_id>/courts/<int:court_id>/delete/', views.manager_delete_court_view, name='manager-delete-court'),

    # Manager court availability/schedule management
    path('facilities/<int:facility_id>/courts/<int:court_id>/availability/', views.manager_court_availability_view, name='manager-court-availability'),
    path('facilities/<int:facility_id>/courts/<int:court_id>/availability/create/', views.manager_create_availability_view, name='manager-create-availability'),
    path('facilities/<int:facility_id>/courts/<int:court_id>/availability/bulk/', views.manager_bulk_create_availability_view, name='manager-bulk-create-availability'),
    path('facilities/<int:facility_id>/courts/<int:court_id>/availability/<int:availability_id>/', views.manager_update_availability_view, name='manager-update-availability'),
    path('facilities/<int:facility_id>/courts/<int:court_id>/availability/<int:availability_id>/delete/', views.manager_delete_availability_view, name='manager-delete-availability'),
]
