from django.contrib import admin
from apps.cart.models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ['unit_price', 'line_total']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    inlines = [CartItemInline]
    list_display = ['user', 'total_items', 'subtotal', 'created_at']
    search_fields = ['user__email']