import uuid
from django.db import models
from django.utils import timezone
from apps.accounts.models import User


class Coupon(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('flat_amount', 'Flat Amount'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=30, unique=True)
    description = models.CharField(max_length=300, blank=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    max_discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    min_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses_total = models.IntegerField(null=True, blank=True)
    max_uses_per_user = models.IntegerField(default=1)
    total_uses = models.IntegerField(default=0)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='created_coupons',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'coupons'
        ordering = ['-created_at']

    def __str__(self):
        return self.code

    def save(self, *args, **kwargs):
        self.code = self.code.upper()
        super().save(*args, **kwargs)

    @property
    def is_valid(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        if self.max_uses_total and self.total_uses >= self.max_uses_total:
            return False
        return True

    def calculate_discount(self, subtotal):
        if self.discount_type == 'percentage':
            discount = subtotal * (self.discount_value / 100)
            if self.max_discount_amount:
                discount = min(discount, self.max_discount_amount)
        else:
            discount = self.discount_value
        return min(discount, subtotal)


class CouponUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coupon = models.ForeignKey(Coupon, on_delete=models.PROTECT, related_name='usages')
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='coupon_usages')
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.PROTECT,
        related_name='coupon_usages',
    )
    discount_applied = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'coupon_usages'
        unique_together = [['coupon', 'user', 'order']]

    def __str__(self):
        return f"{self.coupon.code} used by {self.user.email}"