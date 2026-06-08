from django.contrib import admin
from apps.catalog.models import Category, Product, ProductVariant, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'is_active', 'display_order']
    list_filter = ['is_active', 'parent']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductImageInline, ProductVariantInline]
    list_display = ['name', 'category', 'selling_price', 'is_active', 'is_featured']
    list_filter = ['is_active', 'is_featured', 'category']
    search_fields = ['name', 'sku', 'barcode']
    prepopulated_fields = {'slug': ('name',)}