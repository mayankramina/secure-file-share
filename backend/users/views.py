from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserCreateSerializer
from django.db import IntegrityError
from django.contrib.auth import authenticate
from django.conf import settings
import jwt
from datetime import datetime, timezone
import pyotp
import qrcode
import base64
from io import BytesIO
from .decorators import jwt_required, mfa_enabled, mfa_disabled
from utils.sanitize import sanitize_input
from utils.error_handling import format_serializer_errors


@api_view(['POST'])
def register(request):
    serializer = UserCreateSerializer(data=request.data)
    try:
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Registration successful. Go to login page to login', 'username': serializer.data['username']},
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {'error': format_serializer_errors(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except IntegrityError:
        return Response(
            {'error': 'Database integrity error occurred'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        print(e)
        return Response(
            {'error': 'An unexpected error occurred'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def login(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Both username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate access token
        access_payload = {
            'user_id': user.id,
            'username': user.username,
            'role': user.role,
            'token_type': 'access',
            'exp': datetime.now(timezone.utc) + settings.JWT_SETTINGS['ACCESS_TOKEN_LIFETIME']
        }
        
        # Generate refresh token
        refresh_payload = {
            'user_id': user.id,
            'username': user.username,
            'token_type': 'refresh',
            'exp': datetime.now(timezone.utc) + settings.JWT_SETTINGS['REFRESH_TOKEN_LIFETIME']
        }
        
        access_token = jwt.encode(
            access_payload,
            settings.JWT_SETTINGS['SIGNING_KEY'],
            algorithm=settings.JWT_SETTINGS['ALGORITHM']
        )
        
        refresh_token = jwt.encode(
            refresh_payload,
            settings.JWT_SETTINGS['SIGNING_KEY'],
            algorithm=settings.JWT_SETTINGS['ALGORITHM']
        )
        
        response = Response({'username': user.username})

        # Set access token cookie
        response.set_cookie(
            settings.JWT_COOKIE_NAME,
            access_token,
            max_age=settings.JWT_SETTINGS['ACCESS_TOKEN_LIFETIME'].total_seconds(),
            secure=settings.COOKIE_SECURE,
            httponly=settings.COOKIE_HTTPONLY,
            samesite=settings.SAME_SITE
        )
        
        # Set refresh token cookie
        response.set_cookie(
            settings.JWT_REFRESH_COOKIE_NAME,
            refresh_token,
            max_age=settings.JWT_SETTINGS['REFRESH_TOKEN_LIFETIME'].total_seconds(),
            secure=settings.COOKIE_SECURE,
            httponly=settings.COOKIE_HTTPONLY,
            samesite=settings.SAME_SITE
        )
        
        return response
    except Exception as e:
        print(e)
        return Response(
            {'error': 'An unexpected error occurred'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@jwt_required
@mfa_disabled
def setup_mfa(request):
    try:
        # Generate new TOTP secret
        secret = pyotp.random_base32()
        
        # Create QR code
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            request.user.username,
            issuer_name=settings.MFA_ISSUER_NAME
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        # Create QR code image
        img_buffer = BytesIO()
        qr_image = qr.make_image(fill_color="black", back_color="white")
        qr_image.save(img_buffer, format='PNG')
        qr_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        # Save secret temporarily (will be confirmed in verify step)
        request.user.mfa_secret = secret
        request.user.save()
        
        return Response({
            'secret': secret,
            'qr_code': f'data:image/png;base64,{qr_base64}'
        })
        
    except Exception as e:
        print(e)
        return Response(
            {'error': 'Failed to setup MFA'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def logout(request):
    response = Response({'message': 'Logged out successfully'})
    
    # Clear both access and refresh token cookies
    response.delete_cookie(settings.JWT_COOKIE_NAME)
    response.delete_cookie(settings.JWT_REFRESH_COOKIE_NAME)
    
    return response

@api_view(['POST'])
@jwt_required
@mfa_enabled
def verify_mfa(request):
    try:
        # Sanitize MFA token - no spaces allowed
        totp_code = sanitize_input(request.data.get('token', ''), allow_spaces=False)
        # Only allow digits
        totp_code = ''.join(filter(str.isdigit, totp_code))
        
        if not totp_code:
            return Response(
                {'error': 'TOTP code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not request.user.mfa_secret:
            return Response(
                {'error': 'MFA not set up for this user'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Verify TOTP code
        totp = pyotp.TOTP(request.user.mfa_secret)
        if not totp.verify(totp_code):
            return Response(
                {'error': 'Invalid TOTP code'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        response = Response({'message': 'MFA verified, login successful', 'username': request.user.username})
        
        return response
        
    except Exception as e:
        print(e)
        return Response(
            {'error': 'Failed to verify MFA'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@jwt_required
@mfa_enabled
def disable_mfa(request):
    try:
        request.user.mfa_secret = None
        request.user.save()
        
        response = Response({
            'message': 'MFA disabled successfully'
        })
        return response
        
    except Exception as e:
        print(e)
        return Response(
            {'error': 'Failed to disable MFA'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@jwt_required
@mfa_enabled
def get_my_info(request):
    try:
        user_data = {
            'id': request.user.id,
            'username': request.user.username,
            'role': request.user.role,
            'created_at': request.user.created_at
        }
        return Response(user_data)
    except Exception as e:
        print(e)
        return Response(
            {'error': 'Failed to fetch user information'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )