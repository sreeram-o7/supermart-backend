from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.catalog.models import Category, Product
from apps.inventory.models import Inventory


class Command(BaseCommand):
    help = 'Seed the database with sample categories and products'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding catalog...')

        # Categories
        categories_data = [
            {'name': 'Fruits & Vegetables', 'display_order': 1},
            {'name': 'Dairy & Eggs', 'display_order': 2},
            {'name': 'Snacks & Beverages', 'display_order': 3},
            {'name': 'Staples & Grains', 'display_order': 4},
            {'name': 'Personal Care', 'display_order': 5},
            {'name': 'Household', 'display_order': 6},
        ]

        categories = {}
        for data in categories_data:
            cat, created = Category.objects.get_or_create(
                name=data['name'],
                defaults={
                    'slug': slugify(data['name']),
                    'display_order': data['display_order'],
                    'is_active': True,
                }
            )
            categories[data['name']] = cat
            if created:
                self.stdout.write(f'  Created category: {cat.name}')

        # Products
        products_data = [
            {
                'category': 'Fruits & Vegetables',
                'name': 'Fresh Bananas',
                'brand_name': 'Farm Fresh',
                'short_description': 'Sweet and ripe bananas, rich in potassium',
                'sku': 'FV-BAN-001',
                'barcode': '8901234567890',
                'base_price': 60.00,
                'selling_price': 49.00,
                'unit': 'dozen',
                'is_featured': True,
                'tags': ['fresh', 'fruit', 'organic'],
            },
            {
                'category': 'Fruits & Vegetables',
                'name': 'Fresh Tomatoes',
                'brand_name': 'Farm Fresh',
                'short_description': 'Juicy red tomatoes, perfect for cooking',
                'sku': 'FV-TOM-001',
                'barcode': '8901234567891',
                'base_price': 40.00,
                'selling_price': 35.00,
                'unit': '500g',
                'is_featured': False,
                'tags': ['fresh', 'vegetable'],
            },
            {
                'category': 'Dairy & Eggs',
                'name': 'Amul Full Cream Milk',
                'brand_name': 'Amul',
                'short_description': 'Pure and fresh full cream milk',
                'sku': 'DE-MILK-001',
                'barcode': '8901234567892',
                'base_price': 68.00,
                'selling_price': 64.00,
                'unit': '1L',
                'is_featured': True,
                'tags': ['dairy', 'milk'],
            },
            {
                'category': 'Dairy & Eggs',
                'name': 'Farm Eggs',
                'brand_name': 'Country Eggs',
                'short_description': 'Fresh farm eggs, rich in protein',
                'sku': 'DE-EGG-001',
                'barcode': '8901234567893',
                'base_price': 90.00,
                'selling_price': 84.00,
                'unit': '12 pcs',
                'is_featured': False,
                'tags': ['eggs', 'protein'],
            },
            {
                'category': 'Snacks & Beverages',
                'name': 'Lays Classic Salted',
                'brand_name': "Lay's",
                'short_description': 'Classic salted potato chips',
                'sku': 'SB-LAY-001',
                'barcode': '8901234567894',
                'base_price': 30.00,
                'selling_price': 30.00,
                'unit': '26g',
                'is_featured': True,
                'tags': ['snacks', 'chips'],
            },
            {
                'category': 'Staples & Grains',
                'name': 'Basmati Rice',
                'brand_name': 'India Gate',
                'short_description': 'Premium long grain basmati rice',
                'sku': 'SG-RICE-001',
                'barcode': '8901234567895',
                'base_price': 299.00,
                'selling_price': 259.00,
                'unit': '1kg',
                'is_featured': True,
                'tags': ['rice', 'staples', 'grains'],
            },
        ]

        for data in products_data:
            cat_name = data.pop('category')
            category = categories[cat_name]
            product, created = Product.objects.get_or_create(
                sku=data['sku'],
                defaults={
                    **data,
                    'slug': slugify(data['name']),
                    'category': category,
                    'is_active': True,
                }
            )
            if created:
                Inventory.objects.create(
                    product=product,
                    quantity_in_stock=100,
                    low_stock_threshold=10,
                )
                self.stdout.write(f'  Created product: {product.name}')

        self.stdout.write(self.style.SUCCESS('Catalog seeded successfully!'))