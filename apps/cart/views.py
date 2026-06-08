import logging
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from apps.core.responses import success_response, error_response
from apps.cart.models import Cart, CartItem
from apps.cart.serializers import CartSerializer, AddToCartSerializer, UpdateCartItemSerializer
from apps.cart.services import CartService
from apps.catalog.models import Product, ProductVariant

logger = logging.getLogger(__name__)

SESSION_KEY = 'supermart_cart_session'


def get_session_key(request):
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key


class CartView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            cart = CartService.get_or_create_cart(user=request.user)
        else:
            cart = CartService.get_or_create_cart(session_key=get_session_key(request))

        serializer = CartSerializer(cart)
        return success_response(data=serializer.data)

    def delete(self, request):
        if request.user.is_authenticated:
            cart = CartService.get_or_create_cart(user=request.user)
        else:
            cart = CartService.get_or_create_cart(session_key=get_session_key(request))
        cart.items.all().delete()
        return success_response(message='Cart cleared successfully.')


class CartItemView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message='Invalid data.', errors=serializer.errors)

        try:
            product = Product.objects.get(
                id=serializer.validated_data['product_id'],
                is_active=True,
                is_deleted=False,
            )
        except Product.DoesNotExist:
            return error_response(
                message='Product not found.',
                status_code=status.HTTP_404_NOT_FOUND,
            )

        variant = None
        if serializer.validated_data.get('variant_id'):
            try:
                variant = ProductVariant.objects.get(
                    id=serializer.validated_data['variant_id'],
                    product=product,
                    is_active=True,
                )
            except ProductVariant.DoesNotExist:
                return error_response(message='Variant not found.')

        if not product.is_in_stock:
            return error_response(message='Product is out of stock.')

        if request.user.is_authenticated:
            cart = CartService.get_or_create_cart(user=request.user)
        else:
            cart = CartService.get_or_create_cart(session_key=get_session_key(request))

        item = CartService.add_item(
            cart=cart,
            product=product,
            quantity=serializer.validated_data['quantity'],
            variant=variant,
        )

        return success_response(
            data=CartSerializer(cart).data,
            message=f'{product.name} added to cart.',
        )


class CartItemDetailView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, item_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message='Invalid data.', errors=serializer.errors)

        try:
            if request.user.is_authenticated:
                item = CartItem.objects.get(id=item_id, cart__user=request.user)
            else:
                item = CartItem.objects.get(
                    id=item_id,
                    cart__session_key=get_session_key(request),
                )
        except CartItem.DoesNotExist:
            return error_response(
                message='Cart item not found.',
                status_code=status.HTTP_404_NOT_FOUND,
            )

        CartService.update_item(item, serializer.validated_data['quantity'])
        cart = item.cart if serializer.validated_data['quantity'] > 0 else \
            (CartService.get_or_create_cart(user=request.user) if request.user.is_authenticated
             else CartService.get_or_create_cart(session_key=get_session_key(request)))

        return success_response(
            data=CartSerializer(cart).data,
            message='Cart updated.',
        )

    def delete(self, request, item_id):
        try:
            if request.user.is_authenticated:
                item = CartItem.objects.get(id=item_id, cart__user=request.user)
            else:
                item = CartItem.objects.get(
                    id=item_id,
                    cart__session_key=get_session_key(request),
                )
        except CartItem.DoesNotExist:
            return error_response(
                message='Cart item not found.',
                status_code=status.HTTP_404_NOT_FOUND,
            )

        cart = item.cart
        item.delete()
        return success_response(
            data=CartSerializer(cart).data,
            message='Item removed from cart.',
        )


class CartMergeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_key = request.data.get('session_key')
        if session_key:
            CartService.merge_guest_cart(request.user, session_key)
        return success_response(
            data=CartSerializer(
                CartService.get_or_create_cart(user=request.user)
            ).data,
            message='Cart merged successfully.',
        )