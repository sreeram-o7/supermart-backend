import logging
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.accounts.models import (
    User, UserProfile, Address,
    PasswordResetOTP, EmailVerificationToken,
)
from apps.accounts.utils import (
    generate_otp, get_otp_expiry, get_email_token_expiry,
    send_otp_email, send_verification_email,
)

logger = logging.getLogger(__name__)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': str(self.user.id),
            'email': self.user.email,
            'role': self.user.role,
            'full_name': self.user.full_name,
            'is_email_verified': self.user.is_email_verified,
        }
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)

    class Meta:
        model = User
        fields = ['email', 'phone', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def validate_phone(self, value):
        if value and User.objects.filter(phone=value).exists():
            raise serializers.ValidationError('An account with this phone number already exists.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')

        user = User.objects.create_user(**validated_data)

        user.profile.first_name = first_name
        user.profile.last_name = last_name
        user.profile.save(update_fields=['first_name', 'last_name'])

        token = EmailVerificationToken.objects.create(
            user=user,
            expires_at=get_email_token_expiry(),
        )
        send_verification_email(user, token.token)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'avatar_url',
            'date_of_birth', 'gender',
            'notification_email', 'notification_sms',
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'role', 'is_active',
            'is_email_verified', 'created_at', 'profile',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_email_verified', 'created_at']


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            self.user = User.objects.get(email=value.lower(), is_active=True)
        except User.DoesNotExist:
            self.user = None
        return value.lower()

    def save(self):
        if self.user:
            otp = generate_otp()
            PasswordResetOTP.objects.create(
                user=self.user,
                otp=otp,
                expires_at=get_otp_expiry(),
            )
            send_otp_email(self.user, otp)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {'new_password_confirm': 'Passwords do not match.'}
            )
        try:
            user = User.objects.get(email=attrs['email'].lower(), is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {'email': 'No active account found with this email.'}
            )

        otp_record = PasswordResetOTP.objects.filter(
            user=user,
            otp=attrs['otp'],
            is_used=False,
        ).order_by('-created_at').first()

        if not otp_record:
            raise serializers.ValidationError({'otp': 'Invalid OTP.'})
        if otp_record.is_expired:
            raise serializers.ValidationError(
                {'otp': 'OTP has expired. Please request a new one.'}
            )

        attrs['user'] = user
        attrs['otp_record'] = otp_record
        return attrs

    def save(self):
        user = self.validated_data['user']
        otp_record = self.validated_data['otp_record']
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password', 'updated_at'])
        otp_record.is_used = True
        otp_record.save(update_fields=['is_used'])


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.UUIDField()

    def validate_token(self, value):
        try:
            token_record = EmailVerificationToken.objects.get(
                token=value, is_used=False
            )
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError(
                'Invalid or already used verification token.'
            )
        if token_record.is_expired:
            raise serializers.ValidationError(
                'Verification token has expired. Please request a new one.'
            )
        self.token_record = token_record
        return value

    def save(self):
        user = self.token_record.user
        user.is_email_verified = True
        user.save(update_fields=['is_email_verified', 'updated_at'])
        self.token_record.is_used = True
        self.token_record.save(update_fields=['is_used'])


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()

    def validate_current_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {'new_password_confirm': 'Passwords do not match.'}
            )
        return attrs

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password', 'updated_at'])


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id', 'label', 'full_name', 'phone',
            'address_line1', 'address_line2',
            'city', 'state', 'pin_code', 'country',
            'is_default', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class UpdateProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(max_length=100, source='profile.first_name')
    last_name = serializers.CharField(max_length=100, source='profile.last_name')
    gender = serializers.CharField(
        source='profile.gender', required=False, allow_blank=True
    )
    date_of_birth = serializers.DateField(
        source='profile.date_of_birth', required=False, allow_null=True
    )
    notification_email = serializers.BooleanField(
        source='profile.notification_email', required=False
    )
    notification_sms = serializers.BooleanField(
        source='profile.notification_sms', required=False
    )
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'phone', 'first_name', 'last_name', 'gender',
            'date_of_birth', 'notification_email', 'notification_sms',
        ]

    def validate_phone(self, value):
        user = self.context['request'].user
        if value and User.objects.filter(phone=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('This phone number is already in use.')
        return value

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        phone = validated_data.get('phone')
        if phone is not None:
            instance.phone = phone
            instance.save(update_fields=['phone', 'updated_at'])
        profile = instance.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        return instance