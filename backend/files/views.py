import os
import uuid
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from users.decorators import jwt_required, mfa_enabled, role_required
from .decorators import is_file_present, is_my_file, is_share_present, is_file_not_already_shared, has_file_access, is_link_token_valid
from .models import File, FileShare, ShareableLink
from .serializers import FileSerializer, FileUploadSerializer, FileShareSerializer, FileShareCreateSerializer, SharedFileSerializer
import base64
from django.utils import timezone
from datetime import timedelta
from users.constants import ROLE_ADMIN, ROLE_USER, ROLE_GUEST
from users.constants import PERM_VIEW, PERM_DOWNLOAD
from utils.error_handling import format_serializer_errors

@api_view(['GET'])
@jwt_required
@mfa_enabled
@role_required(ROLE_ADMIN, ROLE_USER)  
def list_files(request):
    files = File.objects.filter(uploaded_by=request.user)
    serializer = FileSerializer(files, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@jwt_required
@mfa_enabled
@role_required(ROLE_ADMIN, ROLE_USER)  
def upload_file(request):
    serializer = FileUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': format_serializer_errors(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    # Create upload directory if it doesn't exist
    upload_path = os.path.join(settings.BASE_DIR, settings.UPLOAD_DIR)
    os.makedirs(upload_path, exist_ok=True)

    # Generate unique filename
    file_obj = request.FILES['file']
    unique_filename = f"{uuid.uuid4()}{os.path.splitext(file_obj.name)[1]}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    full_path = os.path.join(settings.BASE_DIR, file_path)

    # Save file
    with open(full_path, 'wb+') as destination:
        for chunk in file_obj.chunks():
            destination.write(chunk)

    # Create file record
    File.objects.create(
        file_name=serializer.validated_data['file_name'],
        file_path=file_path,
        encrypted_key=serializer.validated_data['encrypted_key'],
        uploaded_by=request.user
    )
    return Response({'message': 'File uploaded successfully'}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@jwt_required
@mfa_enabled
@role_required(ROLE_ADMIN, ROLE_USER, ROLE_GUEST)  
@is_file_present
@has_file_access()
def get_file_details(request, file_id):
    serializer = FileSerializer(request.file)
    return Response(serializer.data)

@api_view(['POST'])
@jwt_required
@mfa_enabled
@role_required(ROLE_ADMIN, ROLE_USER, ROLE_GUEST)
@is_file_present
@has_file_access('DOWNLOAD')
def download_file(request, file_id):
    file = request.file
    # Read the encrypted file and convert to base64
    with open(os.path.join(settings.BASE_DIR, file.file_path), 'rb') as f:
        encrypted_content = base64.b64encode(f.read()).decode('utf-8')
    
    return Response({
        'file_name': file.file_name,
        'encrypted_content': encrypted_content,
        'encrypted_key': file.encrypted_key
    })

@api_view(['GET'])
@jwt_required
@mfa_enabled
@role_required(ROLE_ADMIN, ROLE_USER)
@is_file_present
@is_my_file
def list_file_shares(request, file_id):
    shares = FileShare.objects.filter(file_id=file_id)
    serializer = FileShareSerializer(shares, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@jwt_required
@mfa_enabled
@role_required(ROLE_ADMIN, ROLE_USER)
@is_file_present
@is_my_file
@is_file_not_already_shared
def add_share(request, file_id):
    serializer = FileShareCreateSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response(
            {'error': format_serializer_errors(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    if serializer.validated_data['permission_type'] not in [PERM_VIEW, PERM_DOWNLOAD]:
        return Response({'error': 'Invalid permission type'}, status=status.HTTP_400_BAD_REQUEST)
    FileShare.objects.create(
        file=request.file,
        shared_with_username=serializer.validated_data['shared_with_username'],
        permission_type=serializer.validated_data['permission_type'],
        shared_by=request.user
    )
    return Response(status=status.HTTP_201_CREATED)

@api_view(['PUT'])
@jwt_required
@mfa_enabled
@role_required(ROLE_ADMIN, ROLE_USER)
@is_file_present
@is_my_file
@is_share_present
def update_share(request, file_id, share_id):
    serializer = FileShareCreateSerializer(data=request.data, partial=True)
    if serializer.is_valid():
        request.share.permission_type = serializer.validated_data.get('permission_type', request.share.permission_type)
        request.share.save()
        return Response({'message': 'Share updated successfully'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@jwt_required
@mfa_enabled
@role_required(ROLE_ADMIN, ROLE_USER)
@is_file_present
@is_my_file
@is_share_present
def delete_share(request, file_id, share_id):
    request.share.delete()
    return Response({'message': 'Share deleted successfully'})

@api_view(['GET'])
@jwt_required
@mfa_enabled
@role_required(ROLE_ADMIN, ROLE_USER, ROLE_GUEST)
def list_my_shares(request):
    """Get list of files shared with the current user"""
    shares = FileShare.objects.filter(
        shared_with_username=request.user.username
    ).select_related('file', 'file__uploaded_by', 'shared_by')
    
    serializer = SharedFileSerializer(shares, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@jwt_required
@mfa_enabled
@role_required(ROLE_ADMIN, ROLE_USER, ROLE_GUEST)
@is_file_present
@has_file_access()
def get_file_permission(request, file_id):
    """
    Get user's permission for a specific file
    """
    if request.file.uploaded_by_id == request.user.id:
        return Response({
            'is_owner': True
        })
    
    share = FileShare.objects.get(
        file_id=file_id,
        shared_with_username=request.user.username
    )
    
    return Response({
        'is_owner': False,
        'permission_type': share.permission_type
    })

@api_view(['POST'])
@jwt_required
@mfa_enabled
@role_required(ROLE_ADMIN, ROLE_USER)
@is_file_present
@is_my_file
def generate_link(request, file_id):
    """Generate a shareable link for a file"""
    try:
        expiration_minutes = request.data.get('expiration_minutes', settings.DEFAULT_EXPIRATION_MINUTES)
        expiration_time = timezone.now() + timedelta(minutes=expiration_minutes)

        # Create new shareable link
        link = ShareableLink.objects.create(
            file=request.file,
            created_by=request.user,
            expiration_time=expiration_time
        )
        
        return Response({
            'token': link.token,
            'expiration_time': expiration_time
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to generate link'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@jwt_required
@mfa_enabled
@role_required(ROLE_ADMIN, ROLE_USER, ROLE_GUEST)
@is_link_token_valid 
@has_file_access()    
def verify_link(request):
    """Verify a shareable link and return file details"""
    try:
        return Response({
            'file_id': request.file.id
        })
        
    except Exception as e:
        return Response(
            {'error': 'Failed to verify link'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
