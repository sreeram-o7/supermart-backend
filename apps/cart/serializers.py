from rest_framework import serializers
from apps.cart.models import Cart, CartItem
from apps.catalog.serializers import ProductListSerializer, ProductVariantSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    variant = ProductVariantSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    variant_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    line_total = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_id', 'variant', 'variant_id',
            'quantity', 'unit_price', 'line_total',
        ]
        read_only_fields = ['id', 'unit_price', 'line_total']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.ReadOnlyField()
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'subtotal']


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    variant_id = serializers.UUIDField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, max_value=50, default=1)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0, max_value=50)