import logging
from django.utils import timezone
from django.db import transaction
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.discounts.models import CouponUsage

logger = logging.getLogger(__name__)


def generate_order_number():
    from django.utils import timezone
    import random
    date_str = timezone.now().strftime('%Y%m%d')
    random_suffix = str(random.randint(1000, 9999))
    return f"SM-{date_str}-{random_suffix}"


class OrderService:

    @staticmethod
    @transaction.atomic
    def create_order(user, address, payment_method, cart, coupon=None, notes=''):
        cart_items = cart.items.select_related(
            'product', 'variant', 'product__inventory'
        ).all()

        if not cart_items:
            raise ValueError('Cart is empty.')

        # Validate stock
        for item in cart_items:
            inventory = getattr(item.product, 'inventory', None)
            if inventory and inventory.quantity_available < item.quantity:
                raise ValueError(
                    f'Insufficient stock for {item.product.name}. '
                    f'Available: {inventory.quantity_available}'
                )

        # Calculate totals
        subtotal = cart.subtotal
        discount_amount = 0
        if coupon:
            discount_amount = coupon.calculate_discount(subtotal)

        tax_amount = sum(
            item.line_total * (item.product.tax_rate / 100)
            for item in cart_items
        )
        delivery_fee = 0 if subtotal >= 500 else 40
        total_amount = subtotal - discount_amount + tax_amount + delivery_fee

        # Address snapshot
        address_snapshot = {
            'label': address.label,
            'full_name': address.full_name,
            'phone': address.phone,
            'address_line1': address.address_line1,
            'address_line2': address.address_line2,
            'city': address.city,
            'state': address.state,
            'pin_code': address.pin_code,
            'country': address.country,
        }

        # Create order
        order = Order.objects.create(
            order_number=generate_order_number(),
            user=user,
            address=address,
            coupon=coupon,
            status='pending',
            subtotal=subtotal,
            discount_amount=discount_amount,
            tax_amount=tax_amount,
            delivery_fee=delivery_fee,
            total_amount=total_amount,
            payment_method=payment_method,
            delivery_address_snapshot=address_snapshot,
            notes=notes,
        )

        # Create order items + reserve stock
        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                variant=item.variant,
                product_name=item.product.name,
                product_sku=item.variant.sku if item.variant else item.product.sku,
                quantity=item.quantity,
                unit_price=item.unit_price,
                tax_rate=item.product.tax_rate,
                line_total=item.line_total,
            )
            inventory = getattr(item.product, 'inventory', None)
            if inventory:
                inventory.reserve_stock(item.quantity, reference_id=order.id)

        # Track coupon usage
        if coupon:
            CouponUsage.objects.create(
                coupon=coupon,
                user=user,
                order=order,
                discount_applied=discount_amount,
            )
            coupon.total_uses += 1
            coupon.save(update_fields=['total_uses'])

        # Status history
        OrderStatusHistory.objects.create(
            order=order,
            previous_status='',
            new_status='pending',
            changed_by=user,
            notes='Order placed',
        )

        # Clear cart
        cart.items.all().delete()

        logger.info('Order %s created for user %s', order.order_number, user.email)
        
        # Send notification
        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_order_placed(order)
        except Exception as e:
            logger.error('Failed to send order notification: %s', str(e))

        logger.info('Order %s created for user %s', order.order_number, user.email)
        return order

    @staticmethod
    @transaction.atomic
    def cancel_order(order, user, reason=''):
        if not order.can_cancel():
            raise ValueError('This order cannot be cancelled.')

        previous_status = order.status
        order.status = 'cancelled'
        order.cancelled_at = timezone.now()
        order.cancellation_reason = reason
        order.save(update_fields=['status', 'cancelled_at', 'cancellation_reason', 'updated_at'])

        # Release reserved stock
        for item in order.items.select_related('product__inventory').all():
            inventory = getattr(item.product, 'inventory', None)
            if inventory:
                inventory.quantity_reserved = max(
                    0, inventory.quantity_reserved - item.quantity
                )
                inventory.save(update_fields=['quantity_reserved', 'updated_at'])

        OrderStatusHistory.objects.create(
            order=order,
            previous_status=previous_status,
            new_status='cancelled',
            changed_by=user,
            notes=reason or 'Cancelled by customer',
        )

        logger.info('Order %s cancelled by %s', order.order_number, user.email)
        return order

    @staticmethod
    def update_status(order, new_status, changed_by=None, notes=''):
        previous_status = order.status
        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])
        
        # Send notification
        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_order_status_changed(order, new_status)
        except Exception as e:
            logger.error('Failed to send status notification: %s', str(e))

        OrderStatusHistory.objects.create(
            order=order,
            previous_status=previous_status,
            new_status=new_status,
            changed_by=changed_by,
            notes=notes,
        )
        return order