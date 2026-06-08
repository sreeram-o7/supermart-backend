from rest_framework import serializers
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.payments.serializers import PaymentSerializer
from apps.accounts.serializers import AddressSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'variant', 'product_name', 'product_sku',
            'quantity', 'unit_price', 'tax_rate', 'line_total',
        ]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.CharField(
        source='changed_by.email', read_only=True, default=None
    )

    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'previous_status', 'new_status', 'changed_by_email', 'notes', 'created_at']


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'subtotal',
            'discount_amount', 'total_amount', 'payment_method',
            'item_count', 'payment_status', 'created_at',
        ]

    def get_item_count(self, obj):
        return obj.items.count()

    def get_payment_status(self, obj):
        if hasattr(obj, 'payment'):
            return obj.payment.status
        return 'pending'


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    delivery_address = serializers.JSONField(source='delivery_address_snapshot', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'subtotal',
            'discount_amount', 'tax_amount', 'delivery_fee',
            'total_amount', 'payment_method', 'delivery_address',
            'notes', 'cancelled_at', 'cancellation_reason',
            'items', 'status_history', 'payment', 'created_at', 'updated_at',
        ]


class PlaceOrderSerializer(serializers.Serializer):
    address_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(choices=['cod', 'upi', 'card', 'netbanking', 'wallet'])
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_address_id(self, value):
        user = self.context['request'].user
        from apps.accounts.models import Address
        try:
            self.address = Address.objects.get(id=value, user=user)
        except Address.DoesNotExist:
            raise serializers.ValidationError('Address not found.')
        return value

    def validate(self, attrs):
        if attrs.get('coupon_code'):
            from apps.discounts.models import Coupon, CouponUsage
            try:
                coupon = Coupon.objects.get(code=attrs['coupon_code'].upper())
                if not coupon.is_valid:
                    raise serializers.ValidationError({'coupon_code': 'Invalid or expired coupon.'})
                user = self.context['request'].user
                user_uses = CouponUsage.objects.filter(coupon=coupon, user=user).count()
                if user_uses >= coupon.max_uses_per_user:
                    raise serializers.ValidationError({'coupon_code': 'Coupon already used.'})
                attrs['coupon'] = coupon
            except Coupon.DoesNotExist:
                raise serializers.ValidationError({'coupon_code': 'Invalid coupon code.'})
        return attrs


class CancelOrderSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)