from rest_framework import serializers
from apps.payments.models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'amount', 'status', 'method',
            'transaction_reference', 'paid_at',
            'refunded_at', 'refund_amount', 'created_at',
        ]
        read_only_fields = fields