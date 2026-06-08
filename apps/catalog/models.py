import uuid
from django.db import models
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex
from apps.core.models import BaseModel, ActiveManager


class Category(BaseModel):
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children',
    )
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = 'categories'
        ordering = ['display_order', 'name']
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name

    def get_ancestors(self):
        ancestors = []
        current = self.parent
        while current:
            ancestors.insert(0, current)
            current = current.parent
        return ancestors

    def get_full_path(self):
        ancestors = self.get_ancestors()
        return ' > '.join([a.name for a in ancestors] + [self.name])


class Product(BaseModel):
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products',
    )
    name = models.CharField(max_length=300)
    slug = models.SlugField(max_length=300, unique=True)
    brand_name = models.CharField(max_length=150, blank=True)
    description = models.TextField(blank=True)
    short_description = models.CharField(max_length=500, blank=True)
    sku = models.CharField(max_length=100, unique=True)
    barcode = models.CharField(max_length=100, unique=True, null=True, blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    weight_grams = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    unit = models.CharField(max_length=50, blank=True)
    tags = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.IntegerField(default=0)
    search_vector = SearchVectorField(null=True, blank=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        indexes = [
            GinIndex(fields=['search_vector'], name='product_search_vector_idx'),
            models.Index(fields=['category', 'is_active'], name='product_category_active_idx'),
            models.Index(fields=['selling_price'], name='product_price_idx'),
            models.Index(fields=['is_featured'], name='product_featured_idx'),
            models.Index(fields=['barcode'], name='product_barcode_idx'),
        ]

    def __str__(self):
        return self.name

    @property
    def discount_percentage(self):
        if self.base_price and self.base_price > self.selling_price:
            return int(((self.base_price - self.selling_price) / self.base_price) * 100)
        return 0

    @property
    def primary_image(self):
        return self.images.filter(display_order=0).first()

    @property
    def is_in_stock(self):
        if hasattr(self, 'inventory'):
            return self.inventory.quantity_available > 0
        return False


class ProductVariant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants',
    )
    variant_name = models.CharField(max_length=100)
    sku = models.CharField(max_length=100, unique=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_variants'
        ordering = ['variant_name']

    def __str__(self):
        return f"{self.product.name} — {self.variant_name}"


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images',
    )
    image_url = models.URLField(max_length=500)
    alt_text = models.CharField(max_length=255, blank=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_images'
        ordering = ['display_order']

    def __str__(self):
        return f"Image {self.display_order} for {self.product.name}"