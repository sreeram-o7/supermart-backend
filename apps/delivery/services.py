import random
import string
import logging
from django.utils import timezone
from django.db import transaction
from apps.delivery.models import DeliveryPartner, DeliveryAssignment
from apps.orders.services import OrderService

logger = logging.getLogger(__name__)


def generate_delivery_otp():
    return ''.join(random.choices(string.digits, k=6))


class DeliveryService:

    @staticmethod
    @transaction.atomic
    def assign_delivery(order, partner, assigned_by=None):
        if hasattr(order, 'delivery_assignment'):
            raise ValueError('Order already has a delivery assignment.')

        otp = generate_delivery_otp()
        assignment = DeliveryAssignment.objects.create(
            order=order,
            delivery_partner=partner,
            status='assigned',
            delivery_otp=otp,
        )

        partner.current_load += 1
        partner.save(update_fields=['current_load', 'updated_at'])

        OrderService.update_status(
            order=order,
            new_status='dispatched',
            changed_by=assigned_by,
            notes=f'Assigned to delivery partner: {partner.user.email}',
        )

        logger.info(
            'Order %s assigned to partner %s',
            order.order_number,
            partner.user.email,
        )
        return assignment

    @staticmethod
    @transaction.atomic
    def update_delivery_status(assignment, new_status, partner, notes='', failure_reason=''):
        assignment.status = new_status

        if new_status == 'picked_up':
            assignment.picked_up_at = timezone.now()
            OrderService.update_status(
                order=assignment.order,
                new_status='out_for_delivery',
                changed_by=partner.user,
                notes='Order picked up by delivery partner.',
            )

        elif new_status == 'delivered':
            assignment.delivered_at = timezone.now()
            partner.current_load = max(0, partner.current_load - 1)
            partner.save(update_fields=['current_load', 'updated_at'])
            OrderService.update_status(
                order=assignment.order,
                new_status='delivered',
                changed_by=partner.user,
                notes='Order delivered successfully.',
            )

        elif new_status == 'failed':
            assignment.failure_reason = failure_reason
            assignment.attempt_count += 1
            partner.current_load = max(0, partner.current_load - 1)
            partner.save(update_fields=['current_load', 'updated_at'])

        assignment.notes = notes
        assignment.save()
        return assignment

    @staticmethod
    def confirm_delivery_with_otp(assignment, otp, partner):
        if assignment.delivery_otp != otp:
            raise ValueError('Invalid OTP.')
        if assignment.status == 'delivered':
            raise ValueError('Order already delivered.')
        return DeliveryService.update_delivery_status(
            assignment=assignment,
            new_status='delivered',
            partner=partner,
            notes='Delivery confirmed with OTP.',
        )