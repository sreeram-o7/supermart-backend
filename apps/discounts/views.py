import logging
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.core.responses import success_response, error_response
from apps.core.permissions import IsAdmin
from apps.discounts.models import Coupon
from apps.discounts.serializers import (
    CouponSerializer, ValidateCouponSerializer, AdminCouponWriteSerializer
)

logger = logging.getLogger(__name__)


class ValidateCouponView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ValidateCouponSerializer(
            data=request.data,
            context={'request': request},
        )
        if serializer.is_valid():
            return success_response(
                data={
                    'code': serializer.validated_data['coupon'].code,
                    'discount_type': serializer.validated_data['coupon'].discount_type,
                    'discount_value': str(serializer.validated_data['coupon'].discount_value),
                    'discount_amount': str(serializer.validated_data['discount_amount']),
                    'description': serializer.validated_data['coupon'].description,
                },
                message='Coupon applied successfully.',
            )
        return error_response(message='Invalid coupon.', errors=serializer.errors)


class AdminCouponListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminCouponWriteSerializer
        return CouponSerializer

    def get_queryset(self):
        return Coupon.objects.all()

    def list(self, request, *args, **kwargs):
        serializer = CouponSerializer(self.get_queryset(), many=True)
        return success_response(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = AdminCouponWriteSerializer(
            data=request.data,
            context={'request': request},
        )
        if serializer.is_valid():
            coupon = serializer.save()
            return success_response(
                data=CouponSerializer(coupon).data,
                message='Coupon created successfully.',
            )
        return error_response(message='Failed to create coupon.', errors=serializer.errors)


class AdminCouponDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = CouponSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return Coupon.objects.all()

    def retrieve(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_object()).data)

    def patch(self, request, *args, **kwargs):
        serializer = AdminCouponWriteSerializer(
            self.get_object(),
            data=request.data,
            partial=True,
            context={'request': request},
        )
        if serializer.is_valid():
            serializer.save()
            return success_response(
                data=CouponSerializer(self.get_object()).data,
                message='Coupon updated successfully.',
            )
        return error_response(message='Update failed.', errors=serializer.errors)

    def delete(self, request, *args, **kwargs):
        coupon = self.get_object()
        coupon.is_active = False
        coupon.save(update_fields=['is_active'])
        return success_response(message='Coupon deactivated successfully.')