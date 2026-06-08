from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('django-admin/', admin.site.urls),

    # Auth & Users
    path('api/v1/auth/', include('apps.accounts.urls.auth_urls')),
    path('api/v1/users/', include('apps.accounts.urls.user_urls')),

    # Catalog & Inventory
    path('api/v1/', include('apps.catalog.urls')),
    path('api/v1/', include('apps.inventory.urls')),

    # Cart
    path('api/v1/', include('apps.cart.urls')),

    # Discounts
    path('api/v1/', include('apps.discounts.urls')),

    # Orders
    path('api/v1/', include('apps.orders.urls')),

    # Payments
    path('api/v1/', include('apps.payments.urls')),

    # API Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)