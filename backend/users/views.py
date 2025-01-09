from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserCreateSerializer
from django.db import IntegrityError
from django.contrib.auth import authenticate
from django.utils import timezone
from django.conf import settings
import jwt
from datetime import datetime
import pyotp
import qrcode
import base64
from io import BytesIO
from .decorators import jwt_required


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
            {'error': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    except IntegrityError:
        return Response(
            {'error': 'Database integrity error occurred'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': 'An unexpected error occurred'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    

@api_view(['GET'])
def sample_api(request):
    data = {
        "message": "Hello from Users API",
        "users": [
            {"id": 1, "name": "John Doe", "email": "john@example.com"},
            {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
        ]
    }
    return Response(data) 


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
            'is_mfa_enabled': bool(user.mfa_secret),
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
        
        response = Response({'message': 'Login successful'})
        
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
        return Response(
            {'error': 'An unexpected error occurred'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@jwt_required
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
            'message': 'MFA setup initiated',
            'secret': secret,
            'qr_code': f'data:image/png;base64,{qr_base64}'
        })
        
    except Exception as e:
        return Response(
            {'error': 'Failed to setup MFA'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )