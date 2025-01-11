from rest_framework import serializers
from .models import File

class FileSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    
    class Meta:
        model = File
        fields = ('id', 'file_name', 'created_at', 'uploaded_by_username')
        read_only_fields = ('id', 'created_at', 'uploaded_by_username')

class FileUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)
    encrypted_key = serializers.CharField(write_only=True)

    class Meta:
        model = File
        fields = ('file', 'file_name', 'encrypted_key')