import logging
from django.core.mail import send_mail
from django.conf import settings
from apps.notifications.models import Notification

logger = logging.getLogger(__name__)


class NotificationService:

    @staticmethod
    def create(user, notification_type, title, message, reference_id=None):
        """Create an in-app notification."""
        return Notification.objects.create(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            reference_id=reference_id,
        )

    @staticmethod
    def send_email(user, subject, message):
        """Send an email notification."""
        if not user.profile.notification_email:
            return
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
            logger.info('Email sent to %s: %s', user.email, subject)
        except Exception as e:
            logger.error('Email failed to %s: %s', user.email, str(e))

    @staticmethod
    def notify_order_placed(order):
        user = order.user
        title = f'Order #{order.order_number} Placed'
        message = (
            f'Hi {user.full_name},\n\n'
            f'Your order #{order.order_number} has been placed successfully.\n'
            f'Total: ₹{order.total_amount}\n'
            f'Payment: {order.payment_method.upper()}\n\n'
            f'We will notify you when it is confirmed.\n\n'
            f'— SuperMart Team'
        )
        NotificationService.create(
            user=user,
            notification_type='order_confirmed',
            title=title,
            message=message,
            reference_id=order.id,
        )
        NotificationService.send_email(user, f'SuperMart — {title}', message)

    @staticmethod
    def notify_order_status_changed(order, new_status):
        user = order.user
        status_messages = {
            'confirmed':        ('Order Confirmed', 'Your order has been confirmed and is being processed.'),
            'packed':           ('Order Packed', 'Your order has been packed and is ready for dispatch.'),
            'dispatched':       ('Order Dispatched', 'Your order has been dispatched and is on its way.'),
            'out_for_delivery': ('Out for Delivery', 'Your order is out for delivery. Expect it today!'),
            'delivered':        ('Order Delivered', 'Your order has been delivered. Enjoy your purchase!'),
            'cancelled':        ('Order Cancelled', f'Your order has been cancelled. Reason: {order.cancellation_reason}'),
        }

        if new_status not in status_messages:
            return

        title_suffix, status_msg = status_messages[new_status]
        title = f'Order #{order.order_number} — {title_suffix}'
        message = (
            f'Hi {user.full_name},\n\n'
            f'{status_msg}\n\n'
            f'Order: #{order.order_number}\n'
            f'Total: ₹{order.total_amount}\n\n'
            f'— SuperMart Team'
        )

        notification_type = 'order_delivered' if new_status == 'delivered' \
            else 'order_cancelled' if new_status == 'cancelled' \
            else 'order_dispatched'

        NotificationService.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            reference_id=order.id,
        )
        NotificationService.send_email(user, f'SuperMart — {title}', message)