from django.urls import path
from . import views

app_name = 'auth'

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('verify-mfa/', views.VerifyLoginMFAView.as_view(), name='verify-mfa'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('verify-email/', views.VerifyEmailView.as_view(), name='verify-email'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('csrf/', views.CSRFTokenView.as_view(), name='csrf'),
]