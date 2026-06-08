import logging
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from apps.core.responses import success_response
from apps.core.permissions import IsAdmin
from apps.orders.models import Order
from apps.accounts.models import User
from apps.catalog.models import Product
from apps.inventory.models import Inventory

logger = logging.getLogger(__name__)


class AnalyticsSummaryView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        now = timezone.now()
        today = now.date()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0)
        last_30_days = now - timedelta(days=30)

        # Revenue
        total_revenue = Order.objects.filter(
            status='delivered'
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        monthly_revenue = Order.objects.filter(
            status='delivered',
            created_at__gte=this_month_start,
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Orders
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status='pending').count()
        delivered_orders = Order.objects.filter(status='delivered').count()
        today_orders = Order.objects.filter(
            created_at__date=today
        ).count()

        # Users
        total_users = User.objects.filter(role='customer').count()
        new_users_this_month = User.objects.filter(
            role='customer',
            created_at__gte=this_month_start,
        ).count()

        # Products
        total_products = Product.objects.filter(
            is_active=True, is_deleted=False
        ).count()
        low_stock_count = Inventory.objects.filter(
            quantity_in_stock__lte=10
        ).count()

        return success_response(data={
            'revenue': {
                'total': float(total_revenue),
                'this_month': float(monthly_revenue),
            },
            'orders': {
                'total': total_orders,
                'pending': pending_orders,
                'delivered': delivered_orders,
                'today': today_orders,
            },
            'users': {
                'total': total_users,
                'new_this_month': new_users_this_month,
            },
            'products': {
                'total': total_products,
                'low_stock': low_stock_count,
            },
        })


class SalesChartView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        period = request.query_params.get('period', 'daily')
        last_30_days = timezone.now() - timedelta(days=30)
        last_12_months = timezone.now() - timedelta(days=365)

        if period == 'monthly':
            data = Order.objects.filter(
                created_at__gte=last_12_months,
                status__in=['confirmed', 'packed', 'dispatched', 'out_for_delivery', 'delivered'],
            ).annotate(
                period=TruncMonth('created_at')
            ).values('period').annotate(
                revenue=Sum('total_amount'),
                orders=Count('id'),
            ).order_by('period')

            chart_data = [{
                'period': item['period'].strftime('%b %Y'),
                'revenue': float(item['revenue'] or 0),
                'orders': item['orders'],
            } for item in data]
        else:
            data = Order.objects.filter(
                created_at__gte=last_30_days,
                status__in=['confirmed', 'packed', 'dispatched', 'out_for_delivery', 'delivered'],
            ).annotate(
                period=TruncDate('created_at')
            ).values('period').annotate(
                revenue=Sum('total_amount'),
                orders=Count('id'),
            ).order_by('period')

            chart_data = [{
                'period': item['period'].strftime('%d %b'),
                'revenue': float(item['revenue'] or 0),
                'orders': item['orders'],
            } for item in data]

        return success_response(data=chart_data)


class TopProductsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.orders.models import OrderItem
        from django.db.models import Sum, Count

        top_products = OrderItem.objects.values(
            'product__name',
            'product__sku',
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('line_total'),
            order_count=Count('order', distinct=True),
        ).order_by('-total_quantity')[:10]

        return success_response(data=list(top_products))