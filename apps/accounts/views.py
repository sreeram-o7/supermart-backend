import logging
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from apps.core.responses import success_response, created_response, error_response
from apps.accounts.serializers import (
    RegisterSerializer, UserSerializer, ForgotPasswordSerializer,
    ResetPasswordSerializer, VerifyEmailSerializer, ChangePasswordSerializer,
    AddressSerializer, UpdateProfileSerializer, CustomTokenObtainPairSerializer,
)
from apps.accounts.models import Address

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            logger.info('New user registered: %s', user.email)
            return created_response(
                data={'email': user.email},
                message='Account created successfully. Please check your email to verify your account.',
            )
        return error_response(message='Registration failed.', errors=serializer.errors)


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            data = response.data
            return success_response(
                data={
                    'access': data['access'],
                    'refresh': data['refresh'],
                    'user': data['user'],
                },
                message='Login successful.',
            )
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return error_response(message='Refresh token is required.')
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info('User logged out: %s', request.user.email)
            return success_response(message='Logged out successfully.')
        except TokenError:
            return error_response(message='Invalid or expired refresh token.')


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return success_response(
                message='If an account with that email exists, you will receive an OTP shortly.',
            )
        return error_response(message='Invalid request.', errors=serializer.errors)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return success_response(message='Password reset successfully. You can now log in.')
        return error_response(message='Password reset failed.', errors=serializer.errors)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return success_response(message='Email verified successfully.')
        return error_response(message='Email verification failed.', errors=serializer.errors)


class MeView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(data=serializer.data)


class UpdateProfileView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UpdateProfileSerializer
    http_method_names = ['patch']

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(),
            data=request.data,
            partial=True,
            context={'request': request},
        )
        if serializer.is_valid():
            serializer.save()
            return success_response(
                data=UserSerializer(self.get_object()).data,
                message='Profile updated successfully.',
            )
        return error_response(message='Update failed.', errors=serializer.errors)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request},
        )
        if serializer.is_valid():
            serializer.save()
            return success_response(message='Password changed successfully.')
        return error_response(message='Password change failed.', errors=serializer.errors)


class AddressListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AddressSerializer

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return success_response(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request},
        )
        if serializer.is_valid():
            serializer.save()
            return created_response(data=serializer.data, message='Address added successfully.')
        return error_response(message='Failed to add address.', errors=serializer.errors)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AddressSerializer
    http_method_names = ['get', 'patch', 'delete']

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(data=serializer.data)

    def patch(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(), data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return success_response(data=serializer.data, message='Address updated successfully.')
        return error_response(message='Update failed.', errors=serializer.errors)

    def delete(self, request, *args, **kwargs):
        self.get_object().delete()
        return success_response(message='Address deleted successfully.')


class SetDefaultAddressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            address = Address.objects.get(pk=pk, user=request.user)
        except Address.DoesNotExist:
            return error_response(
                message='Address not found.',
                status_code=status.HTTP_404_NOT_FOUND,
            )
        address.is_default = True
        address.save()
        return success_response(message='Default address updated successfully.')