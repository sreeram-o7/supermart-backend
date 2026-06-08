import uuid
from django.db import models
from apps.catalog.models import Product


class Inventory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        related_name='inventory',
    )
    quantity_in_stock = models.IntegerField(default=0)
    quantity_reserved = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=10)
    reorder_quantity = models.IntegerField(default=50)
    last_restocked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory'
        verbose_name_plural = 'inventory'

    def __str__(self):
        return f"Inventory for {self.product.name}"

    @property
    def quantity_available(self):
        return max(0, self.quantity_in_stock - self.quantity_reserved)

    @property
    def is_low_stock(self):
        return self.quantity_available <= self.low_stock_threshold

    @property
    def is_out_of_stock(self):
        return self.quantity_available <= 0

    def add_stock(self, quantity, performed_by=None, notes=''):
        before = self.quantity_in_stock
        self.quantity_in_stock += quantity
        self.save(update_fields=['quantity_in_stock', 'updated_at'])
        StockMovement.objects.create(
            inventory=self,
            movement_type='restock',
            quantity_change=quantity,
            quantity_before=before,
            quantity_after=self.quantity_in_stock,
            performed_by=performed_by,
            notes=notes,
        )

    def reserve_stock(self, quantity, reference_id=None):
        if self.quantity_available < quantity:
            raise ValueError(f'Insufficient stock. Available: {self.quantity_available}')
        before = self.quantity_reserved
        self.quantity_reserved += quantity
        self.save(update_fields=['quantity_reserved', 'updated_at'])
        StockMovement.objects.create(
            inventory=self,
            movement_type='reserved',
            quantity_change=quantity,
            quantity_before=before,
            quantity_after=self.quantity_reserved,
            reference_id=reference_id,
        )

    def release_stock(self, quantity, reference_id=None):
        self.quantity_reserved = max(0, self.quantity_reserved - quantity)
        self.quantity_in_stock = max(0, self.quantity_in_stock - quantity)
        self.save(update_fields=['quantity_reserved', 'quantity_in_stock', 'updated_at'])
        StockMovement.objects.create(
            inventory=self,
            movement_type='sale',
            quantity_change=-quantity,
            quantity_before=self.quantity_in_stock + quantity,
            quantity_after=self.quantity_in_stock,
            reference_id=reference_id,
        )


class StockMovement(models.Model):
    MOVEMENT_TYPES = [
        ('restock', 'Restock'),
        ('sale', 'Sale'),
        ('return', 'Return'),
        ('adjustment', 'Adjustment'),
        ('reserved', 'Reserved'),
        ('released', 'Released'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inventory = models.ForeignKey(
        Inventory,
        on_delete=models.PROTECT,
        related_name='movements',
    )
    movement_type = models.CharField(max_length=30, choices=MOVEMENT_TYPES)
    quantity_change = models.IntegerField()
    quantity_before = models.IntegerField()
    quantity_after = models.IntegerField()
    reference_id = models.UUIDField(null=True, blank=True)
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_movements',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_movements'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.movement_type} — {self.quantity_change} units"