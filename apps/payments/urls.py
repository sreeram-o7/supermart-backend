from django.urls import path
from apps.payments import views

urlpatterns = [
    path('payments/initiate/', views.InitiatePaymentView.as_view(), name='payment-initiate'),
    path('payments/confirm/', views.ConfirmPaymentView.as_view(), name='payment-confirm'),
    path('admin/payments/', views.AdminPaymentListView.as_view(), name='admin-payments'),
]