from django.urls import path
from apps.accounts import views

urlpatterns = [
    path('profile/', views.UpdateProfileView.as_view(), name='user-profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='user-change-password'),
    path('addresses/', views.AddressListCreateView.as_view(), name='user-addresses'),
    path('addresses/<uuid:pk>/', views.AddressDetailView.as_view(), name='user-address-detail'),
    path('addresses/<uuid:pk>/set-default/', views.SetDefaultAddressView.as_view(), name='user-address-set-default'),
]