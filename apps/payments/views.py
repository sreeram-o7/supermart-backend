import logging
import uuid
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.core.responses import success_response, error_response
from apps.core.permissions import IsAdmin
from apps.payments.models import Payment
from apps.payments.serializers import PaymentSerializer

logger = logging.getLogger(__name__)


class InitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        if not order_id:
            return error_response(message='order_id is required.')

        try:
            from apps.orders.models import Order
            order = Order.objects.get(
                id=order_id,
                user=request.user,
            )
        except Order.DoesNotExist:
            return error_response(
                message='Order not found.',
                status_code=status.HTTP_404_NOT_FOUND,
            )

        payment, created = Payment.objects.get_or_create(
            order=order,
            defaults={
                'amount': order.total_amount,
                'method': order.payment_method,
                'status': 'pending',
            }
        )

        # Mock payment — auto-confirm for COD
        if order.payment_method == 'cod':
            payment.status = 'paid'
            payment.paid_at = timezone.now()
            payment.transaction_reference = f'COD-{uuid.uuid4().hex[:8].upper()}'
            payment.save()
            order.status = 'confirmed'
            order.save(update_fields=['status', 'updated_at'])

        return success_response(
            data=PaymentSerializer(payment).data,
            message='Payment initiated successfully.',
        )


class ConfirmPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        transaction_reference = request.data.get('transaction_reference',
                                                  f'TXN-{uuid.uuid4().hex[:8].upper()}')
        try:
            payment = Payment.objects.get(order__id=order_id, order__user=request.user)
        except Payment.DoesNotExist:
            return error_response(message='Payment not found.')

        payment.status = 'paid'
        payment.paid_at = timezone.now()
        payment.transaction_reference = transaction_reference
        payment.save()

        payment.order.status = 'confirmed'
        payment.order.save(update_fields=['status', 'updated_at'])

        return success_response(
            data=PaymentSerializer(payment).data,
            message='Payment confirmed successfully.',
        )


class AdminPaymentListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        payments = Payment.objects.select_related('order').all()
        serializer = PaymentSerializer(payments, many=True)
        return success_response(data=serializer.data)