from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from .models import File, FileShare

def is_file_present(view_func):
    @wraps(view_func)
    def wrapped(request, file_id, *args, **kwargs):
        try:
            file = File.objects.get(id=file_id)
            request.file = file
            return view_func(request, file_id, *args, **kwargs)
        except File.DoesNotExist:
            return Response(
                {'error': 'File not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    return wrapped

def is_my_file(view_func):
    @wraps(view_func)
    def wrapped(request, file_id, *args, **kwargs):
        if request.file.uploaded_by_id != request.user.id:
            return Response(
                {'error': 'Access denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, file_id, *args, **kwargs)
    return wrapped 

def is_share_present(view_func):
    @wraps(view_func)
    def wrapped(request, file_id, share_id, *args, **kwargs):
        try:
            share = FileShare.objects.get(id=share_id, file_id=file_id)
            request.share = share
            return view_func(request, file_id, share_id, *args, **kwargs)
        except FileShare.DoesNotExist:
            return Response(
                {'error': 'Share not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    return wrapped

def is_file_not_already_shared(view_func):
    @wraps(view_func)
    def wrapped(request, file_id, *args, **kwargs):
        if FileShare.objects.filter(
            file_id=file_id,
            shared_with_username=request.data.get('username')
        ).exists():
            return Response(
                {'error': 'File already shared with this user'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return view_func(request, file_id, *args, **kwargs)
    return wrapped 