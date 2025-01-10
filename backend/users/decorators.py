from functools import wraps
from django.conf import settings
import jwt
from rest_framework.response import Response
from rest_framework import status
from .models import User
from datetime import datetime, timezone

def jwt_required(view_func):
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        access_token = request.COOKIES.get(settings.JWT_COOKIE_NAME)
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
        
        # No tokens present
        if not access_token and not refresh_token:
            return Response(
                {},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            # Try to validate access token first
            payload = jwt.decode(
                access_token,
                settings.JWT_SETTINGS['SIGNING_KEY'],
                algorithms=[settings.JWT_SETTINGS['ALGORITHM']]
            )
            
            if payload['token_type'] != 'access':
                raise jwt.InvalidTokenError
            
            request.user = User.objects.get(id=payload['user_id'])
            return view_func(request, *args, **kwargs)
            
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, TypeError):
            # Access token invalid, try refresh token
            if not refresh_token:
                return Response(
                    {'error': 'Invalid token and no refresh token'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            try:
                # Validate refresh token
                refresh_payload = jwt.decode(
                    refresh_token,
                    settings.JWT_SETTINGS['SIGNING_KEY'],
                    algorithms=[settings.JWT_SETTINGS['ALGORITHM']]
                )
                
                if refresh_payload['token_type'] != 'refresh':
                    raise jwt.InvalidTokenError
                
                # Generate new access token
                user = User.objects.get(id=refresh_payload['user_id'])
                new_access_payload = {
                    'user_id': user.id,
                    'username': user.username,
                    'role': user.role,
                    'token_type': 'access',
                    'exp': datetime.now(timezone.utc) + settings.JWT_SETTINGS['ACCESS_TOKEN_LIFETIME']
                }
                
                new_access_token = jwt.encode(
                    new_access_payload,
                    settings.JWT_SETTINGS['SIGNING_KEY'],
                    algorithm=settings.JWT_SETTINGS['ALGORITHM']
                )
                
                # Set new access token in request for response modification
                request.new_access_token = new_access_token
                request.user = user
                
                response = view_func(request, *args, **kwargs)
                
                # Set new access token cookie in response
                response.set_cookie(
                    settings.JWT_COOKIE_NAME,
                    new_access_token,
                    max_age=settings.JWT_SETTINGS['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                    secure=settings.COOKIE_SECURE,
                    httponly=settings.COOKIE_HTTPONLY,
                    samesite=settings.SAME_SITE
                )
                
                return response
                
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist):
                # Both tokens are invalid, clear cookies
                response = Response(
                    {'error': 'Login expired', 'login_expired': True},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                response.delete_cookie(settings.JWT_COOKIE_NAME)
                response.delete_cookie(settings.JWT_REFRESH_COOKIE_NAME)
                return response
                
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    return wrapped 

def mfa_enabled(view_func):
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        # Simply check if MFA is enabled
        if request.user.mfa_secret:
            response = view_func(request, *args, **kwargs)
            return response
            
        return Response(
            {'error': 'MFA required', 'requires_mfa_setup': True},
            status=status.HTTP_403_FORBIDDEN
        )
        
    return wrapped

def mfa_disabled(view_func):
    @wraps(view_func) 
    def wrapped(request, *args, **kwargs):
        # Simply check if MFA is disabled
        if not request.user.mfa_secret:
            response = view_func(request, *args, **kwargs)
            return response
            
        return Response(
            {'error': 'MFA already setup'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    return wrapped