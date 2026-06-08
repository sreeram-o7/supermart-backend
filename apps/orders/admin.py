from django.contrib import admin
from apps.orders.models import Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'product_sku', 'unit_price', 'line_total']


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ['previous_status', 'new_status', 'changed_by', 'created_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    inlines = [OrderItemInline, OrderStatusHistoryInline]
    list_display = ['order_number', 'user', 'status', 'total_amount', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_method']
    search_fields = ['order_number', 'user__email']
    readonly_fields = ['order_number', 'created_at', 'updated_at']