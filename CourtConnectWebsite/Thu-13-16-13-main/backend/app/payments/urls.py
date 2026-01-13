from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    path('create/', views.create_payment_order, name='create'),
    path('capture/', views.capture_payment, name='capture'),
    path('<int:payment_id>/', views.get_payment, name='detail'),
    path('<int:payment_id>/refund/', views.refund_payment, name='refund'),
]