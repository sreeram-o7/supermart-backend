import django_filters
from apps.catalog.models import Product


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='selling_price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='selling_price', lookup_expr='lte')
    category = django_filters.CharFilter(field_name='category__slug', lookup_expr='exact')
    brand = django_filters.CharFilter(field_name='brand_name', lookup_expr='icontains')
    is_featured = django_filters.BooleanFilter(field_name='is_featured')
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')

    class Meta:
        model = Product
        fields = ['min_price', 'max_price', 'category', 'brand', 'is_featured']

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(inventory__quantity_in_stock__gt=0)
        return queryset