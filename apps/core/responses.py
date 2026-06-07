from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, message='Success', status_code=status.HTTP_200_OK):
    return Response({'status': 'success', 'message': message, 'data': data}, status=status_code)


def created_response(data=None, message='Created successfully'):
    return success_response(data, message, status.HTTP_201_CREATED)


def no_content_response(message='Deleted successfully'):
    return Response({'status': 'success', 'message': message}, status=status.HTTP_204_NO_CONTENT)


def error_response(message='An error occurred', errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    return Response({'status': 'error', 'message': message, 'errors': errors or {}}, status=status_code)