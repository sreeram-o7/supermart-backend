from django.contrib import admin
from apps.payments.models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['order', 'amount', 'status', 'method', 'paid_at']
    list_filter = ['status', 'method']
    search_fields = ['order__order_number', 'transaction_reference']