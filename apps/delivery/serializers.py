from rest_framework import serializers
from apps.delivery.models import DeliveryPartner, DeliveryAssignment
from apps.accounts.serializers import UserSerializer


class DeliveryPartnerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    is_accepting = serializers.ReadOnlyField()

    class Meta:
        model = DeliveryPartner
        fields = [
            'id', 'user', 'vehicle_type', 'vehicle_number',
            'is_available', 'current_load', 'max_load',
            'is_accepting', 'created_at',
        ]


class DeliveryPartnerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryPartner
        fields = ['vehicle_type', 'vehicle_number', 'is_available', 'max_load']


class DeliveryAssignmentSerializer(serializers.ModelSerializer):
    partner_email = serializers.CharField(
        source='delivery_partner.user.email', read_only=True
    )
    order_number = serializers.CharField(
        source='order.order_number', read_only=True
    )
    customer_name = serializers.SerializerMethodField()
    delivery_address = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryAssignment
        fields = [
            'id', 'order', 'order_number', 'delivery_partner',
            'partner_email', 'customer_name', 'delivery_address',
            'status', 'assigned_at', 'picked_up_at', 'delivered_at',
            'failure_reason', 'attempt_count', 'notes', 'created_at',
        ]
        read_only_fields = [
            'id', 'assigned_at', 'picked_up_at',
            'delivered_at', 'created_at',
        ]

    def get_customer_name(self, obj):
        return obj.order.delivery_address_snapshot.get('full_name', '')

    def get_delivery_address(self, obj):
        snap = obj.order.delivery_address_snapshot
        return (
            f"{snap.get('address_line1', '')}, "
            f"{snap.get('city', '')}, "
            f"{snap.get('pin_code', '')}"
        )


class AssignDeliverySerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    partner_id = serializers.UUIDField()

    def validate_order_id(self, value):
        from apps.orders.models import Order
        try:
            order = Order.objects.get(id=value)
            if hasattr(order, 'delivery_assignment'):
                raise serializers.ValidationError(
                    'Order already has a delivery assignment.'
                )
            self.order = order
        except Order.DoesNotExist:
            raise serializers.ValidationError('Order not found.')
        return value

    def validate_partner_id(self, value):
        try:
            partner = DeliveryPartner.objects.get(id=value)
            if not partner.is_accepting:
                raise serializers.ValidationError(
                    'Partner is not available or has reached max load.'
                )
            self.partner = partner
        except DeliveryPartner.DoesNotExist:
            raise serializers.ValidationError('Delivery partner not found.')
        return value


class UpdateDeliveryStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['picked_up', 'out_for_delivery', 'delivered', 'failed']
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    failure_reason = serializers.CharField(required=False, allow_blank=True)


class ConfirmDeliverySerializer(serializers.Serializer):
    otp = serializers.CharField(max_length=6, min_length=6)