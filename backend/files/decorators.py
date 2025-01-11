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
        # Check if file is already shared with this user
        existing_share = FileShare.objects.filter(
            file_id=file_id,
            shared_with_username=request.data.get('shared_with_username')
        ).exists()
        
        if existing_share:
            return Response(
                {'error': 'File is already shared with this user'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return view_func(request, file_id, *args, **kwargs)
    return wrapped 

def has_file_access(required_permission=None):
    """
    Decorator to check if user has access to the file.
    Assumes @is_file_present has already set request.file
    If required_permission is None, any share type (VIEW/DOWNLOAD) is sufficient.
    If required_permission is specified (e.g., 'DOWNLOAD'), the share must match that permission.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(request, file_id, *args, **kwargs):
            # If user is the owner, they have full access
            if request.file.uploaded_by_id == request.user.id:
                return view_func(request, file_id, *args, **kwargs)
            
            # Check if file is shared with the user
            share = FileShare.objects.filter(
                file_id=file_id,
                shared_with_username=request.user.username
            ).first()
            
            if not share:
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # If required_permission is specified, check if user has that permission
            if required_permission and share.permission_type != required_permission:
                return Response(
                    {'error': f'{required_permission} permission required'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(request, file_id, *args, **kwargs)
        return wrapped
    return decorator 