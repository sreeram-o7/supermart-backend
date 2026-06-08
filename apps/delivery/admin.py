from django.contrib import admin
from apps.delivery.models import DeliveryPartner, DeliveryAssignment


@admin.register(DeliveryPartner)
class DeliveryPartnerAdmin(admin.ModelAdmin):
    list_display = ['user', 'vehicle_type', 'is_available', 'current_load', 'max_load']
    list_filter = ['is_available', 'vehicle_type']
    search_fields = ['user__email', 'vehicle_number']


@admin.register(DeliveryAssignment)
class DeliveryAssignmentAdmin(admin.ModelAdmin):
    list_display = ['order', 'delivery_partner', 'status', 'assigned_at', 'delivered_at']
    list_filter = ['status']
    search_fields = ['order__order_number', 'delivery_partner__user__email']