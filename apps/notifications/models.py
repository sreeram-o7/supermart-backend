import uuid
from django.db import models
from apps.accounts.models import User


class Notification(models.Model):
    TYPE_CHOICES = [
        ('order_confirmed',  'Order Confirmed'),
        ('order_dispatched', 'Order Dispatched'),
        ('order_delivered',  'Order Delivered'),
        ('order_cancelled',  'Order Cancelled'),
        ('low_stock',        'Low Stock Alert'),
        ('promo',            'Promotion'),
        ('system',           'System'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    reference_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} — {self.user.email}"