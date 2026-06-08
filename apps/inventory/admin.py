from django.contrib import admin
from apps.inventory.models import Inventory, StockMovement


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'quantity_in_stock', 'quantity_reserved', 'low_stock_threshold']
    search_fields = ['product__name', 'product__sku']
    list_filter = ['last_restocked_at']


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['inventory', 'movement_type', 'quantity_change', 'created_at']
    list_filter = ['movement_type']
    readonly_fields = ['created_at']