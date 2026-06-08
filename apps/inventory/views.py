import logging
from rest_framework import generics, status
from rest_framework.views import APIView
from apps.core.responses import success_response, error_response
from apps.core.permissions import IsAdmin
from apps.inventory.models import Inventory, StockMovement
from apps.inventory.serializers import (
    InventorySerializer, InventoryUpdateSerializer,
    LowStockSerializer, StockMovementSerializer,
)

logger = logging.getLogger(__name__)


class AdminInventoryDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = InventorySerializer
    lookup_field = 'product_id'

    def get_queryset(self):
        return Inventory.objects.select_related('product')

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(data=serializer.data)

    def patch(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(), data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return success_response(
                data=serializer.data,
                message='Inventory updated successfully.',
            )
        return error_response(message='Update failed.', errors=serializer.errors)


class AdminInventoryRestockView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, product_id):
        try:
            inventory = Inventory.objects.get(product_id=product_id)
        except Inventory.DoesNotExist:
            return error_response(
                message='Inventory not found.',
                status_code=status.HTTP_404_NOT_FOUND,
            )
        serializer = InventoryUpdateSerializer(data=request.data)
        if serializer.is_valid():
            inventory.add_stock(
                quantity=serializer.validated_data['quantity'],
                performed_by=request.user,
                notes=serializer.validated_data.get('notes', ''),
            )
            return success_response(
                data=InventorySerializer(inventory).data,
                message=f"Added {serializer.validated_data['quantity']} units to stock.",
            )
        return error_response(message='Invalid data.', errors=serializer.errors)


class AdminLowStockView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = LowStockSerializer

    def get_queryset(self):
        return Inventory.objects.filter(
            quantity_in_stock__lte=models.F('low_stock_threshold')
        ).select_related('product')

    def list(self, request, *args, **kwargs):
        from django.db import models
        queryset = Inventory.objects.select_related('product').filter(
            quantity_in_stock__lte=10
        )
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


class AdminStockMovementView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = StockMovementSerializer

    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        return StockMovement.objects.filter(
            inventory__product_id=product_id
        ).select_related('performed_by')

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(data=serializer.data)