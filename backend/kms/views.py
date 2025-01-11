from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from users.decorators import jwt_required, mfa_enabled
from .decorators import key_exists
from .models import KeyPair, KeyAccess
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
import base64
from users.models import User

def generate_key_pair():
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    public_key = private_key.public_key()
    
    # Serialize keys to PEM format
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    return public_pem.decode(), private_pem.decode()

@api_view(['POST'])
@jwt_required
@mfa_enabled
def create_or_get_key(request):
    try:
        key_pair = KeyPair.objects.get(username=request.user.username)
        return Response({'public_key': key_pair.public_key})
    except KeyPair.DoesNotExist:
        public_key, private_key = generate_key_pair()
        KeyPair.objects.create(
            username=request.user.username,
            public_key=public_key,
            private_key=private_key
        )
        return Response({'public_key': public_key})

@api_view(['POST'])
@jwt_required
@mfa_enabled
@key_exists
def decrypt_string(request):
    if not request.data.get('encrypted'):
        return Response(
            {'error': 'encrypted is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    key_owner_username = request.data.get('key_owner_username', request.user.username)
    
    try:
        # Check if user has access to the key
        if key_owner_username != request.user.username:
            if not KeyAccess.objects.filter(
                key_owner_username=key_owner_username,
                shared_with_username=request.user.username
            ).exists():
                return Response(
                    {'error': 'No access to this key'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        key_pair = KeyPair.objects.get(username=key_owner_username)
        private_key = serialization.load_pem_private_key(
            key_pair.private_key.encode(),
            password=None,
            backend=default_backend()
        )

        # The encrypted data is already in base64 format
        encrypted_data = base64.b64decode(request.data['encrypted'])
        decrypted_data = private_key.decrypt(
            encrypted_data,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        # Return the decrypted data in base64 format
        return Response({
            'decrypted': base64.b64encode(decrypted_data).decode('utf-8')
        })
    except Exception as e:
        print(f"Decryption error: {str(e)}")  # Add better error logging
        return Response(
            {'error': 'Decryption failed'},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@jwt_required
@mfa_enabled
def grant_access(request):
    if not request.data.get('username'):
        return Response(
            {'error': 'username is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        shared_with_user = User.objects.get(username=request.data['username'])
        # Prevent sharing with self
        if shared_with_user == request.user:
            return Response(
                {'error': 'Cannot share key with yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        KeyAccess.objects.get_or_create(
            key_owner_username=request.user.username,
            shared_with_username=shared_with_user.username
        )
        return Response({})
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@jwt_required
@mfa_enabled
def revoke_access(request):
    if not request.data.get('username'):
        return Response(
            {'error': 'username is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        KeyAccess.objects.filter(
            key_owner_username=request.user.username,
            shared_with_username=request.data['username']
        ).delete()
        return Response({})
    except Exception as e:
        return Response(
            {},
            status=status.HTTP_400_BAD_REQUEST
        )
