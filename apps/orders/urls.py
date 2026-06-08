from django.urls import path
from apps.orders import views

urlpatterns = [
    # Customer
    path('orders/', views.PlaceOrderView.as_view(), name='order-place'),
    path('orders/list/', views.OrderListView.as_view(), name='order-list'),
    path('orders/<str:order_number>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:order_number>/cancel/', views.CancelOrderView.as_view(), name='order-cancel'),
    path('orders/<str:order_number>/track/', views.OrderTrackingView.as_view(), name='order-track'),

    # Admin
    path('admin/orders/', views.AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/orders/<str:order_number>/', views.AdminOrderDetailView.as_view(), name='admin-order-detail'),
    path('admin/orders/<str:order_number>/status/', views.AdminUpdateOrderStatusView.as_view(), name='admin-order-status'),
]