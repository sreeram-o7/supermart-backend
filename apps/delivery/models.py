import uuid
from django.db import models
from apps.accounts.models import User
from apps.orders.models import Order


class DeliveryPartner(models.Model):
    VEHICLE_CHOICES = [
        ('bicycle', 'Bicycle'),
        ('motorcycle', 'Motorcycle'),
        ('car', 'Car'),
        ('van', 'Van'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='delivery_partner',
    )
    vehicle_type = models.CharField(
        max_length=50, choices=VEHICLE_CHOICES, blank=True
    )
    vehicle_number = models.CharField(max_length=20, blank=True)
    is_available = models.BooleanField(default=True)
    current_load = models.IntegerField(default=0)
    max_load = models.IntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'delivery_partners'

    def __str__(self):
        return f"Partner: {self.user.email}"

    @property
    def is_accepting(self):
        return self.is_available and self.current_load < self.max_load


class DeliveryAssignment(models.Model):
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('picked_up', 'Picked Up'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('returned', 'Returned'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(
        Order,
        on_delete=models.PROTECT,
        related_name='delivery_assignment',
    )
    delivery_partner = models.ForeignKey(
        DeliveryPartner,
        on_delete=models.PROTECT,
        related_name='assignments',
    )
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default='assigned'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    delivery_otp = models.CharField(max_length=6, blank=True)
    failure_reason = models.TextField(blank=True)
    attempt_count = models.IntegerField(default=1)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'delivery_assignments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Delivery for {self.order.order_number}"