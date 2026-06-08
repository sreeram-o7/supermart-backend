from rest_framework import serializers
from apps.discounts.models import Coupon, CouponUsage


class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.ReadOnlyField()

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'max_discount_amount', 'min_order_value', 'max_uses_per_user',
            'total_uses', 'valid_from', 'valid_until', 'is_active', 'is_valid',
        ]
        read_only_fields = ['id', 'total_uses', 'created_at']


class ValidateCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=30)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate(self, attrs):
        code = attrs['code'].upper()
        subtotal = attrs['subtotal']

        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError({'code': 'Invalid coupon code.'})

        if not coupon.is_valid:
            raise serializers.ValidationError({'code': 'This coupon is expired or inactive.'})

        if subtotal < coupon.min_order_value:
            raise serializers.ValidationError({
                'code': f'Minimum order value of ₹{coupon.min_order_value} required.'
            })

        user = self.context.get('request').user
        if user and user.is_authenticated:
            user_uses = CouponUsage.objects.filter(coupon=coupon, user=user).count()
            if user_uses >= coupon.max_uses_per_user:
                raise serializers.ValidationError({
                    'code': 'You have already used this coupon.'
                })

        attrs['coupon'] = coupon
        attrs['discount_amount'] = coupon.calculate_discount(subtotal)
        return attrs


class AdminCouponWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            'code', 'description', 'discount_type', 'discount_value',
            'max_discount_amount', 'min_order_value', 'max_uses_total',
            'max_uses_per_user', 'valid_from', 'valid_until', 'is_active',
        ]

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)