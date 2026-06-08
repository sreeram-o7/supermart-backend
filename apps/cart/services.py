import logging
from apps.cart.models import Cart, CartItem

logger = logging.getLogger(__name__)


class CartService:

    @staticmethod
    def get_or_create_cart(user=None, session_key=None):
        if user and user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=user)
            return cart
        if session_key:
            cart, _ = Cart.objects.get_or_create(session_key=session_key)
            return cart
        return None

    @staticmethod
    def add_item(cart, product, quantity=1, variant=None):
        unit_price = variant.selling_price if variant else product.selling_price
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            variant=variant,
            defaults={'quantity': quantity, 'unit_price': unit_price},
        )
        if not created:
            item.quantity += quantity
            item.save(update_fields=['quantity', 'updated_at'])
        return item

    @staticmethod
    def update_item(item, quantity):
        if quantity <= 0:
            item.delete()
            return None
        item.quantity = quantity
        item.save(update_fields=['quantity', 'updated_at'])
        return item

    @staticmethod
    def merge_guest_cart(user, session_key):
        try:
            guest_cart = Cart.objects.get(session_key=session_key)
        except Cart.DoesNotExist:
            return

        user_cart, _ = Cart.objects.get_or_create(user=user)

        for guest_item in guest_cart.items.all():
            existing = CartItem.objects.filter(
                cart=user_cart,
                product=guest_item.product,
                variant=guest_item.variant,
            ).first()

            if existing:
                existing.quantity += guest_item.quantity
                existing.save(update_fields=['quantity', 'updated_at'])
            else:
                guest_item.cart = user_cart
                guest_item.save(update_fields=['cart'])

        guest_cart.delete()
        logger.info('Merged guest cart into user cart for %s', user.email)