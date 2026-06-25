from django.urls import path
from apps.catalog import views

urlpatterns = [
    # Public endpoints
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('categories/<slug:slug>/', views.CategoryDetailView.as_view(), name='category-detail'),
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/search/', views.ProductSearchView.as_view(), name='product-search'),
    path('products/featured/', views.FeaturedProductsView.as_view(), name='product-featured'),
    path('products/barcode/<str:barcode>/', views.BarcodeSearchView.as_view(), name='product-barcode'),
    path('products/<slug:slug>/', views.ProductDetailView.as_view(), name='product-detail'),

    # Admin endpoints
    path('admin/products/', views.AdminProductListCreateView.as_view(), name='admin-product-list'),
    path('admin/products/<uuid:id>/', views.AdminProductDetailView.as_view(), name='admin-product-detail'),
    path('admin/categories/', views.AdminCategoryListCreateView.as_view(), name='admin-category-list'),

    #products CSV upload endpoint
    path('admin/products/bulk-import/', views.AdminBulkImportView.as_view(), name='admin-bulk-import'),
    path('admin/products/import-template/', views.BulkImportTemplateView.as_view(), name='import-template'),

]