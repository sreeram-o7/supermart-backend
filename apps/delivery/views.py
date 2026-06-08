import logging
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from apps.core.responses import success_response, error_response
from apps.core.permissions import IsDeliveryPartner, IsDeliveryManager, IsAdmin
from apps.delivery.models import DeliveryPartner, DeliveryAssignment
from apps.delivery.serializers import (
    DeliveryPartnerSerializer, DeliveryPartnerWriteSerializer,
    DeliveryAssignmentSerializer, AssignDeliverySerializer,
    UpdateDeliveryStatusSerializer, ConfirmDeliverySerializer,
)
from apps.delivery.services import DeliveryService

logger = logging.getLogger(__name__)


class DeliveryPartnerProfileView(APIView):
    permission_classes = [IsDeliveryPartner]

    def get(self, request):
        try:
            partner = DeliveryPartner.objects.select_related('user').get(
                user=request.user
            )
            return success_response(
                data=DeliveryPartnerSerializer(partner).data
            )
        except DeliveryPartner.DoesNotExist:
            return error_response(
                message='Delivery partner profile not found.',
                status_code=status.HTTP_404_NOT_FOUND,
            )

    def patch(self, request):
        try:
            partner = DeliveryPartner.objects.get(user=request.user)
        except DeliveryPartner.DoesNotExist:
            return error_response(message='Profile not found.')

        serializer = DeliveryPartnerWriteSerializer(
            partner, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return success_response(
                data=DeliveryPartnerSerializer(partner).data,
                message='Profile updated.',
            )
        return error_response(message='Update failed.', errors=serializer.errors)


class MyAssignmentsView(generics.ListAPIView):
    permission_classes = [IsDeliveryPartner]
    serializer_class = DeliveryAssignmentSerializer

    def get_queryset(self):
        try:
            partner = DeliveryPartner.objects.get(user=self.request.user)
            return DeliveryAssignment.objects.filter(
                delivery_partner=partner
            ).select_related('order').order_by('-created_at')
        except DeliveryPartner.DoesNotExist:
            return DeliveryAssignment.objects.none()

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(data=serializer.data)


class UpdateDeliveryStatusView(APIView):
    permission_classes = [IsDeliveryPartner]

    def patch(self, request, assignment_id):
        try:
            partner = DeliveryPartner.objects.get(user=request.user)
            assignment = DeliveryAssignment.objects.get(
                id=assignment_id,
                delivery_partner=partner,
            )
        except (DeliveryPartner.DoesNotExist, DeliveryAssignment.DoesNotExist):
            return error_response(
                message='Assignment not found.',
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = UpdateDeliveryStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message='Invalid data.', errors=serializer.errors
            )

        try:
            assignment = DeliveryService.update_delivery_status(
                assignment=assignment,
                new_status=serializer.validated_data['status'],
                partner=partner,
                notes=serializer.validated_data.get('notes', ''),
                failure_reason=serializer.validated_data.get('failure_reason', ''),
            )
            return success_response(
                data=DeliveryAssignmentSerializer(assignment).data,
                message=f'Delivery status updated to {assignment.status}.',
            )
        except ValueError as e:
            return error_response(message=str(e))


class ConfirmDeliveryView(APIView):
    permission_classes = [IsDeliveryPartner]

    def post(self, request, assignment_id):
        try:
            partner = DeliveryPartner.objects.get(user=request.user)
            assignment = DeliveryAssignment.objects.get(
                id=assignment_id,
                delivery_partner=partner,
            )
        except (DeliveryPartner.DoesNotExist, DeliveryAssignment.DoesNotExist):
            return error_response(
                message='Assignment not found.',
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = ConfirmDeliverySerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message='Invalid OTP.', errors=serializer.errors
            )

        try:
            assignment = DeliveryService.confirm_delivery_with_otp(
                assignment=assignment,
                otp=serializer.validated_data['otp'],
                partner=partner,
            )
            return success_response(
                data=DeliveryAssignmentSerializer(assignment).data,
                message='Delivery confirmed successfully.',
            )
        except ValueError as e:
            return error_response(message=str(e))


class ManagerAssignmentsView(generics.ListAPIView):
    permission_classes = [IsDeliveryManager]
    serializer_class = DeliveryAssignmentSerializer

    def get_queryset(self):
        queryset = DeliveryAssignment.objects.select_related(
            'order', 'delivery_partner__user'
        ).order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(data=serializer.data)


class AssignDeliveryView(APIView):
    permission_classes = [IsDeliveryManager]

    def post(self, request):
        serializer = AssignDeliverySerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message='Invalid data.', errors=serializer.errors
            )
        try:
            assignment = DeliveryService.assign_delivery(
                order=serializer.order,
                partner=serializer.partner,
                assigned_by=request.user,
            )
            return success_response(
                data=DeliveryAssignmentSerializer(assignment).data,
                message='Delivery assigned successfully.',
            )
        except ValueError as e:
            return error_response(message=str(e))


class ManagerPartnerListView(generics.ListAPIView):
    permission_classes = [IsDeliveryManager]
    serializer_class = DeliveryPartnerSerializer

    def get_queryset(self):
        return DeliveryPartner.objects.select_related('user').all()

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(data=serializer.data)


class AdminCreatePartnerView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return error_response(message='user_id is required.')

        from apps.accounts.models import User
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return error_response(message='User not found.')

        user.role = 'delivery_partner'
        user.save(update_fields=['role'])

        partner, created = DeliveryPartner.objects.get_or_create(
            user=user,
            defaults={
                'vehicle_type': request.data.get('vehicle_type', 'motorcycle'),
                'vehicle_number': request.data.get('vehicle_number', ''),
            }
        )
        return success_response(
            data=DeliveryPartnerSerializer(partner).data,
            message='Delivery partner created successfully.',
        )