from rest_framework import serializers
from apps.inventory.models import Inventory, StockMovement


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = [
            'id', 'movement_type', 'quantity_change',
            'quantity_before', 'quantity_after',
            'reference_id', 'notes', 'created_at',
        ]
        read_only_fields = fields


class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    quantity_available = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()

    class Meta:
        model = Inventory
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity_in_stock', 'quantity_reserved', 'quantity_available',
            'low_stock_threshold', 'reorder_quantity',
            'is_low_stock', 'is_out_of_stock',
            'last_restocked_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'product', 'quantity_available', 'created_at', 'updated_at']


class InventoryUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(required=False, allow_blank=True)


class LowStockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    quantity_available = serializers.ReadOnlyField()

    class Meta:
        model = Inventory
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity_in_stock', 'quantity_available', 'low_stock_threshold',
        ]