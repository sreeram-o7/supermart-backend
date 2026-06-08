from django.urls import path
from apps.analytics import views

urlpatterns = [
    path('admin/analytics/summary/', views.AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('admin/analytics/sales-chart/', views.SalesChartView.as_view(), name='analytics-sales-chart'),
    path('admin/analytics/top-products/', views.TopProductsView.as_view(), name='analytics-top-products'),
]