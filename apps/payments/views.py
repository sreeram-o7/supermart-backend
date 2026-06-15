import logging
import uuid
import razorpay
from django.utils import timezone
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.core.responses import success_response, error_response
from apps.core.permissions import IsAdmin
from apps.payments.models import Payment
from apps.payments.serializers import PaymentSerializer

logger = logging.getLogger(__name__)


def get_razorpay_client():
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


class InitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        if not order_id:
            return error_response(message='order_id is required.')

        try:
            from apps.orders.models import Order
            order = Order.objects.get(id=order_id, user=request.user)
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

        # COD — auto confirm
        if order.payment_method == 'cod':
            payment.status = 'paid'
            payment.paid_at = timezone.now()
            payment.transaction_reference = f'COD-{uuid.uuid4().hex[:8].upper()}'
            payment.save()
            order.status = 'confirmed'
            order.save(update_fields=['status', 'updated_at'])
            return success_response(
                data={
                    'payment': PaymentSerializer(payment).data,
                    'method': 'cod',
                },
                message='Order confirmed. Pay on delivery.',
            )

        # Online payment — create Razorpay order
        try:
            client = get_razorpay_client()
            razorpay_order = client.order.create({
                'amount': int(order.total_amount * 100),
                'currency': 'INR',
                'receipt': str(order.order_number),
                'notes': {
                    'order_id': str(order.id),
                    'user_email': request.user.email,
                }
            })

            payment.transaction_reference = razorpay_order['id']
            payment.gateway_response = razorpay_order
            payment.save()

            return success_response(
                data={
                    'razorpay_order_id': razorpay_order['id'],
                    'razorpay_key_id': settings.RAZORPAY_KEY_ID,
                    'amount': int(order.total_amount * 100),
                    'currency': 'INR',
                    'order_number': order.order_number,
                    'user_name': request.user.full_name,
                    'user_email': request.user.email,
                    'payment_id': str(payment.id),
                },
                message='Payment initiated.',
            )
        except Exception as e:
            logger.error('Razorpay order creation failed: %s', str(e))
            return error_response(
                message='Payment initiation failed. Please try again.'
            )


class ConfirmPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
            return error_response(message='Missing payment verification data.')

        try:
            client = get_razorpay_client()
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature,
            })
        except razorpay.errors.SignatureVerificationError:
            return error_response(
                message='Payment verification failed. Invalid signature.'
            )

        try:
            payment = Payment.objects.get(
                transaction_reference=razorpay_order_id,
                order__user=request.user,
            )
        except Payment.DoesNotExist:
            return error_response(message='Payment record not found.')

        payment.status = 'paid'
        payment.paid_at = timezone.now()
        payment.gateway_response = {
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_order_id': razorpay_order_id,
            'razorpay_signature': razorpay_signature,
        }
        payment.save()

        payment.order.status = 'confirmed'
        payment.order.save(update_fields=['status', 'updated_at'])

        logger.info(
            'Payment confirmed for order %s — Razorpay ID: %s',
            payment.order.order_number,
            razorpay_payment_id,
        )

        return success_response(
            data=PaymentSerializer(payment).data,
            message='Payment successful! Your order is confirmed.',
        )


class AdminPaymentListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        payments = Payment.objects.select_related('order').all()
        serializer = PaymentSerializer(payments, many=True)
        return success_response(data=serializer.data)