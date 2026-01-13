from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Manager application endpoints
    path('apply-manager/', views.submit_manager_application, name='apply-manager'),
    path('manager-application-status/', views.get_manager_application_status, name='manager-application-status'),
]