from django.urls import path
from apps.delivery import views

urlpatterns = [
    # Delivery partner
    path('delivery/profile/', views.DeliveryPartnerProfileView.as_view(), name='delivery-profile'),
    path('delivery/assignments/', views.MyAssignmentsView.as_view(), name='my-assignments'),
    path('delivery/assignments/<uuid:assignment_id>/status/', views.UpdateDeliveryStatusView.as_view(), name='update-delivery-status'),
    path('delivery/assignments/<uuid:assignment_id>/confirm/', views.ConfirmDeliveryView.as_view(), name='confirm-delivery'),

    # Delivery manager
    path('delivery/manager/assignments/', views.ManagerAssignmentsView.as_view(), name='manager-assignments'),
    path('delivery/manager/assign/', views.AssignDeliveryView.as_view(), name='assign-delivery'),
    path('delivery/manager/partners/', views.ManagerPartnerListView.as_view(), name='partner-list'),

    # Admin
    path('delivery/admin/create-partner/', views.AdminCreatePartnerView.as_view(), name='admin-create-partner'),
]