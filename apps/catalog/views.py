import logging
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from apps.core.responses import success_response, error_response
from apps.core.permissions import IsAdmin
from apps.catalog.models import Category, Product
from apps.catalog.serializers import (
    CategorySerializer, CategoryListSerializer,
    ProductListSerializer, ProductDetailSerializer,
    ProductWriteSerializer,
)
from apps.catalog.filters import ProductFilter

logger = logging.getLogger(__name__)


class CategoryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(
            parent=None,
            is_active=True,
            is_deleted=False,
        ).prefetch_related('children')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


class CategoryDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return Category.objects.filter(is_active=True, is_deleted=False)

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(data=serializer.data)


class ProductListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    filterset_class = ProductFilter
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['selling_price', 'avg_rating', 'created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True,
            is_deleted=False,
        ).select_related('category').prefetch_related('images', 'inventory')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


class ProductDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True,
            is_deleted=False,
        ).select_related('category').prefetch_related('images', 'variants', 'inventory')

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(data=serializer.data)


class ProductSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return error_response(message='Search query is required.')

        search_query = SearchQuery(query)
        search_vector = SearchVector('name', weight='A') + \
                        SearchVector('brand_name', weight='B') + \
                        SearchVector('description', weight='C')

        products = Product.objects.filter(
            is_active=True,
            is_deleted=False,
        ).annotate(
            rank=SearchRank(search_vector, search_query)
        ).filter(rank__gte=0.01).order_by('-rank').select_related(
            'category'
        ).prefetch_related('images')[:50]

        serializer = ProductListSerializer(products, many=True)
        return success_response(
            data=serializer.data,
            message=f'Found {len(serializer.data)} results for "{query}"',
        )


class BarcodeSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, barcode):
        try:
            product = Product.objects.filter(
                barcode=barcode,
                is_active=True,
                is_deleted=False,
            ).select_related('category').prefetch_related(
                'images', 'variants', 'inventory'
            ).get()
            serializer = ProductDetailSerializer(product)
            return success_response(data=serializer.data)
        except Product.DoesNotExist:
            return error_response(
                message=f'No product found with barcode {barcode}.',
                status_code=status.HTTP_404_NOT_FOUND,
            )


class FeaturedProductsView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True,
            is_deleted=False,
            is_featured=True,
        ).select_related('category').prefetch_related('images', 'inventory')[:12]

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(data=serializer.data)


# Admin views
class AdminProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['selling_price', 'created_at', 'name']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductWriteSerializer
        return ProductListSerializer

    def get_queryset(self):
        return Product.all_objects.select_related(
            'category'
        ).prefetch_related('images', 'inventory')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(queryset, many=True)
        return success_response(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = ProductWriteSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            return success_response(
                data=ProductDetailSerializer(product).data,
                message='Product created successfully.',
            )
        return error_response(message='Failed to create product.', errors=serializer.errors)


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProductWriteSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        return Product.all_objects.select_related(
            'category'
        ).prefetch_related('images', 'variants', 'inventory')

    def retrieve(self, request, *args, **kwargs):
        serializer = ProductDetailSerializer(self.get_object())
        return success_response(data=serializer.data)

    def patch(self, request, *args, **kwargs):
        serializer = ProductWriteSerializer(
            self.get_object(), data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return success_response(
                data=ProductDetailSerializer(self.get_object()).data,
                message='Product updated successfully.',
            )
        return error_response(message='Update failed.', errors=serializer.errors)

    def delete(self, request, *args, **kwargs):
        product = self.get_object()
        product.soft_delete()
        return success_response(message='Product deleted successfully.')


class AdminCategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.all_objects.all()

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return success_response(
                data=serializer.data,
                message='Category created successfully.',
            )
        return error_response(message='Failed to create category.', errors=serializer.errors)