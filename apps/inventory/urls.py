from django.urls import path
from apps.inventory import views

urlpatterns = [
    path('admin/inventory/<uuid:product_id>/', views.AdminInventoryDetailView.as_view(), name='admin-inventory-detail'),
    path('admin/inventory/<uuid:product_id>/restock/', views.AdminInventoryRestockView.as_view(), name='admin-inventory-restock'),
    path('admin/inventory/<uuid:product_id>/movements/', views.AdminStockMovementView.as_view(), name='admin-stock-movements'),
    path('admin/inventory/low-stock/', views.AdminLowStockView.as_view(), name='admin-low-stock'),
]