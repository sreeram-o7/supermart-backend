from .base import *
from decouple import config

DEBUG = True

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'supermart_db',
        'USER': 'supermart_user',
        'PASSWORD': 'supermart_pass',
        'HOST': 'localhost',
        'PORT': '5432',
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

AXES_ENABLED = True