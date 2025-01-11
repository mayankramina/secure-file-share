import os
import uuid
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from users.decorators import jwt_required, mfa_enabled
from .decorators import is_file_present, is_my_file
from .models import File
from .serializers import FileSerializer, FileUploadSerializer
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
