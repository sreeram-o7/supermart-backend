from rest_framework import serializers
from apps.catalog.models import Category, Product, ProductVariant, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image_url',
            'display_order', 'parent', 'children', 'product_count',
        ]

    def get_children(self, obj):
        children = obj.children.filter(is_active=True, is_deleted=False)
        return CategorySerializer(children, many=True).data

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True, is_deleted=False).count()


class CategoryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image_url', 'display_order']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'alt_text', 'display_order']


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'variant_name', 'sku',
            'base_price', 'selling_price', 'stock_quantity', 'is_active',
        ]


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    primary_image = ProductImageSerializer(read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'brand_name', 'short_description',
            'sku', 'base_price', 'selling_price', 'tax_rate',
            'unit', 'is_active', 'is_featured', 'avg_rating',
            'review_count', 'category_name', 'primary_image',
            'discount_percentage', 'is_in_stock', 'tags',
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategoryListSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'brand_name', 'description',
            'short_description', 'sku', 'barcode', 'base_price',
            'selling_price', 'tax_rate', 'weight_grams', 'unit',
            'tags', 'is_active', 'is_featured', 'avg_rating',
            'review_count', 'category', 'images', 'variants',
            'discount_percentage', 'is_in_stock', 'created_at',
        ]


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'category', 'name', 'slug', 'brand_name', 'description',
            'short_description', 'sku', 'barcode', 'base_price',
            'selling_price', 'tax_rate', 'weight_grams', 'unit',
            'tags', 'is_active', 'is_featured',
        ]

    def validate(self, attrs):
        base_price = attrs.get('base_price', 0)
        selling_price = attrs.get('selling_price', 0)
        if selling_price > base_price:
            raise serializers.ValidationError(
                {'selling_price': 'Selling price cannot be greater than base price.'}
            )
        return attrs