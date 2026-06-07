import random
import string
import logging
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))


def get_otp_expiry():
    return timezone.now() + timedelta(minutes=10)


def get_email_token_expiry():
    return timezone.now() + timedelta(hours=24)


def send_otp_email(user, otp):
    subject = 'SuperMart — Password Reset OTP'
    message = (
        f'Hi {user.full_name},\n\n'
        f'Your OTP for password reset is: {otp}\n\n'
        f'This OTP expires in 10 minutes.\n\n'
        f'If you did not request this, please ignore this email.\n\n'
        f'— SuperMart Team'
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info('OTP email sent to %s', user.email)
    except Exception as e:
        logger.error('Failed to send OTP email to %s: %s', user.email, str(e))


def send_verification_email(user, token):
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject = 'SuperMart — Verify Your Email'
    message = (
        f'Hi {user.full_name},\n\n'
        f'Welcome to SuperMart! Please verify your email:\n\n'
        f'{verification_url}\n\n'
        f'This link expires in 24 hours.\n\n'
        f'— SuperMart Team'
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info('Verification email sent to %s', user.email)
    except Exception as e:
        logger.error('Failed to send verification email to %s: %s', user.email, str(e))


def lockout_response(request, credentials, *args, **kwargs):
    return Response(
        {
            'status': 'error',
            'message': 'Account locked due to too many failed attempts. Try again in 15 minutes.',
            'errors': {},
        },
        status=status.HTTP_429_TOO_MANY_REQUESTS,
    )