from django.urls import path
from apps.accounts import views

urlpatterns = [
    path('profile/', views.UpdateProfileView.as_view(), name='user-profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='user-change-password'),
    path('addresses/', views.AddressListCreateView.as_view(), name='user-addresses'),
    path('addresses/<uuid:pk>/', views.AddressDetailView.as_view(), name='user-address-detail'),
    path('addresses/<uuid:pk>/set-default/', views.SetDefaultAddressView.as_view(), name='user-address-set-default'),
    
    # Admin user management
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<uuid:id>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
]