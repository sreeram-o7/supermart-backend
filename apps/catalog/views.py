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

class AdminBulkImportView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return error_response(message='No file uploaded.')

        if not file.name.endswith(('.csv', '.xlsx', '.xls')):
            return error_response(message='Only CSV or Excel files are supported.')

        import pandas as pd
        from django.utils.text import slugify
        from apps.inventory.models import Inventory

        try:
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            else:
                df = pd.read_excel(file)
        except Exception as e:
            return error_response(message=f'Failed to read file: {str(e)}')

        required_columns = ['name', 'sku', 'category', 'base_price', 'selling_price', 'unit']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return error_response(
                message=f'Missing required columns: {", ".join(missing_columns)}'
            )

        created_count = 0
        updated_count = 0
        skipped_rows = []

        for index, row in df.iterrows():
            row_num = index + 2  # +2 for header row and 0-index

            try:
                name = str(row['name']).strip()
                sku = str(row['sku']).strip()
                category_name = str(row['category']).strip()

                if not name or not sku or not category_name:
                    skipped_rows.append({
                        'row': row_num,
                        'reason': 'Missing name, sku, or category',
                    })
                    continue

                category = Category.objects.filter(
                    name__iexact=category_name
                ).first()

                if not category:
                    category = Category.objects.create(
                        name=category_name,
                        slug=slugify(category_name),
                        is_active=True,
                    )

                base_price = float(row['base_price'])
                selling_price = float(row['selling_price'])

                if selling_price > base_price:
                    skipped_rows.append({
                        'row': row_num,
                        'reason': f'Selling price ({selling_price}) cannot exceed base price ({base_price})',
                    })
                    continue

                product_defaults = {
                    'name': name,
                    'slug': slugify(name),
                    'category': category,
                    'brand_name': str(row.get('brand_name', '')).strip() if pd.notna(row.get('brand_name')) else '',
                    'short_description': str(row.get('short_description', '')).strip() if pd.notna(row.get('short_description')) else '',
                    'base_price': base_price,
                    'selling_price': selling_price,
                    'unit': str(row['unit']).strip(),
                    'is_active': True,
                    'is_featured': bool(row.get('is_featured', False)) if pd.notna(row.get('is_featured')) else False,
                }

                barcode = row.get('barcode')
                if pd.notna(barcode) and str(barcode).strip():
                    product_defaults['barcode'] = str(barcode).strip()

                product, created = Product.objects.update_or_create(
                    sku=sku,
                    defaults=product_defaults,
                )

                stock_qty = row.get('stock_quantity', 100)
                stock_qty = int(stock_qty) if pd.notna(stock_qty) else 100

                Inventory.objects.update_or_create(
                    product=product,
                    defaults={'quantity_in_stock': stock_qty}
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            except Exception as e:
                skipped_rows.append({
                    'row': row_num,
                    'reason': str(e),
                })

        return success_response(
            data={
                'created': created_count,
                'updated': updated_count,
                'skipped': len(skipped_rows),
                'skipped_details': skipped_rows[:20],  # limit to first 20 errors
                'total_rows_processed': len(df),
            },
            message=f'Import complete: {created_count} created, {updated_count} updated, {len(skipped_rows)} skipped.',
        )


class BulkImportTemplateView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        import pandas as pd
        from django.http import HttpResponse
        import io

        sample_data = {
            'name': ['Fresh Apples', 'Maggi Noodles'],
            'sku': ['FV-APP-002', 'SB-MAG-002'],
            'category': ['Fruits & Vegetables', 'Snacks & Beverages'],
            'brand_name': ['Farm Fresh', 'Maggi'],
            'base_price': [120.00, 14.00],
            'selling_price': [99.00, 14.00],
            'unit': ['1kg', '70g'],
            'short_description': ['Fresh red apples', '2-minute instant noodles'],
            'barcode': ['8901111111111', '8901111111112'],
            'stock_quantity': [100, 200],
            'is_featured': [True, False],
        }

        df = pd.DataFrame(sample_data)
        buffer = io.StringIO()
        df.to_csv(buffer, index=False)
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="product_import_template.csv"'
        return response