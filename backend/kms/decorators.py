from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from .models import KeyPair


def key_exists(view_func):
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        try:
            KeyPair.objects.get(username=request.data.get('key_owner_username', request.user.username))
            return view_func(request, *args, **kwargs)
        except KeyPair.DoesNotExist:
            return Response(
                {'error': 'No key pair found for user'},
                status=status.HTTP_404_NOT_FOUND
            )
    return wrapped 