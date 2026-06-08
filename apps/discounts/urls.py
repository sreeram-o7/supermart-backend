from django.urls import path
from apps.discounts import views

urlpatterns = [
    path('discounts/validate-coupon/', views.ValidateCouponView.as_view(), name='validate-coupon'),
    path('admin/coupons/', views.AdminCouponListCreateView.as_view(), name='admin-coupon-list'),
    path('admin/coupons/<uuid:id>/', views.AdminCouponDetailView.as_view(), name='admin-coupon-detail'),
]