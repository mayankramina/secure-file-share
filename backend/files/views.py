import os
import uuid
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from users.decorators import jwt_required, mfa_enabled
from .decorators import is_file_present, is_my_file, is_share_present, is_file_not_already_shared
from .models import File, FileShare
from .serializers import FileSerializer, FileUploadSerializer, FileShareSerializer, FileShareCreateSerializer
import base64

@api_view(['GET'])
@jwt_required
@mfa_enabled
def list_files(request):
    files = File.objects.filter(uploaded_by=request.user)
    serializer = FileSerializer(files, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@jwt_required
@mfa_enabled
def upload_file(request):
    serializer = FileUploadSerializer(data=request.data)
    if serializer.is_valid():
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
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@jwt_required
@mfa_enabled
@is_file_present
@is_my_file
def get_file_details(request, file_id):
    serializer = FileSerializer(request.file)
    return Response(serializer.data)

@api_view(['POST'])
@jwt_required
@mfa_enabled
@is_file_present
@is_my_file
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
@is_file_present
@is_my_file
def list_shares(request, file_id):
    shares = FileShare.objects.filter(file_id=file_id)
    serializer = FileShareSerializer(shares, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@jwt_required
@mfa_enabled
@is_file_present
@is_my_file
@is_file_not_already_shared
def add_share(request, file_id):
    serializer = FileShareCreateSerializer(data=request.data)
    if serializer.is_valid():
        FileShare.objects.create(
            file=request.file,
            shared_with_username=serializer.validated_data['shared_with_username'],
            permission_type=serializer.validated_data['permission_type'],
            shared_by=request.user
        )
        return Response(status=status.HTTP_201_CREATED)
    return Response(
        {'error': serializer.errors},
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['PUT'])
@jwt_required
@mfa_enabled
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
@is_file_present
@is_my_file
@is_share_present
def delete_share(request, file_id, share_id):
    request.share.delete()
    return Response({'message': 'Share deleted successfully'})
