import uuid
from django.db import models
from apps.accounts.models import User
from apps.catalog.models import Product, ProductVariant


class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='cart',
        null=True,
        blank=True,
    )
    session_key = models.CharField(max_length=64, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carts'

    def __str__(self):
        return f"Cart of {self.user.email if self.user else 'Guest'}"

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        return sum(item.line_total for item in self.items.all())


class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='cart_items')
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='cart_items',
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cart_items'
        unique_together = [['cart', 'product', 'variant']]

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    def save(self, *args, **kwargs):
        if not self.unit_price:
            if self.variant:
                self.unit_price = self.variant.selling_price
            else:
                self.unit_price = self.product.selling_price
        super().save(*args, **kwargs)