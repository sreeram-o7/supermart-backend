import logging
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from apps.core.responses import success_response, error_response
from apps.core.permissions import IsAdmin
from apps.orders.models import Order
from apps.orders.serializers import (
    OrderListSerializer, OrderDetailSerializer,
    PlaceOrderSerializer, CancelOrderSerializer,
)
from apps.orders.services import OrderService
from apps.cart.services import CartService

logger = logging.getLogger(__name__)


class PlaceOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PlaceOrderSerializer(
            data=request.data,
            context={'request': request},
        )
        if not serializer.is_valid():
            return error_response(message='Invalid order data.', errors=serializer.errors)

        cart = CartService.get_or_create_cart(user=request.user)
        if not cart.items.exists():
            return error_response(message='Your cart is empty.')

        try:
            order = OrderService.create_order(
                user=request.user,
                address=serializer.address,
                payment_method=serializer.validated_data['payment_method'],
                cart=cart,
                coupon=serializer.validated_data.get('coupon'),
                notes=serializer.validated_data.get('notes', ''),
            )
            return success_response(
                data=OrderDetailSerializer(order).data,
                message=f'Order {order.order_number} placed successfully!',
            )
        except ValueError as e:
            return error_response(message=str(e))


class OrderListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related('items').select_related('coupon')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


class OrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderDetailSerializer
    lookup_field = 'order_number'

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related(
            'items', 'status_history', 'payment'
        ).select_related('address', 'coupon')

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(data=serializer.data)


class OrderTrackingView(generics.RetrieveAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = []
    lookup_field = 'order_number'

    def get_queryset(self):
        return Order.objects.prefetch_related(
            'items', 'status_history'
        )

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(data=serializer.data)


class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_number):
        try:
            order = Order.objects.get(
                order_number=order_number,
                user=request.user,
            )
        except Order.DoesNotExist:
            return error_response(
                message='Order not found.',
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = CancelOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message='Invalid data.', errors=serializer.errors)

        try:
            order = OrderService.cancel_order(
                order=order,
                user=request.user,
                reason=serializer.validated_data.get('reason', ''),
            )
            return success_response(
                data=OrderDetailSerializer(order).data,
                message='Order cancelled successfully.',
            )
        except ValueError as e:
            return error_response(message=str(e))


class AdminOrderListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        queryset = Order.objects.prefetch_related(
            'items'
        ).select_related('user', 'coupon')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


class AdminOrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAdmin]
    serializer_class = OrderDetailSerializer
    lookup_field = 'order_number'

    def get_queryset(self):
        return Order.objects.prefetch_related(
            'items', 'status_history', 'payment'
        ).select_related('user', 'address', 'coupon')

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(data=serializer.data)


class AdminUpdateOrderStatusView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return error_response(
                message='Order not found.',
                status_code=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get('status')
        notes = request.data.get('notes', '')

        valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return error_response(message=f'Invalid status. Choose from: {valid_statuses}')

        order = OrderService.update_status(
            order=order,
            new_status=new_status,
            changed_by=request.user,
            notes=notes,
        )
        return success_response(
            data=OrderDetailSerializer(order).data,
            message=f'Order status updated to {new_status}.',
        )