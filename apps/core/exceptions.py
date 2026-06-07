import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'status': 'error',
            'message': _get_message(response.data),
            'errors': response.data,
        }
        response.data = error_data
    else:
        logger.exception('Unhandled exception in %s', context.get('view'))
        response = Response(
            {
                'status': 'error',
                'message': 'An unexpected error occurred. Please try again.',
                'errors': {},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response


def _get_message(data):
    if isinstance(data, dict):
        if 'detail' in data:
            return str(data['detail'])
        first_key = next(iter(data), None)
        if first_key:
            first_val = data[first_key]
            if isinstance(first_val, list) and first_val:
                return str(first_val[0])
            return str(first_val)
    if isinstance(data, list) and data:
        return str(data[0])
    return 'An error occurred.'