from rest_framework import serializers
from .models import File, FileShare
from utils.sanitize import sanitize_input
from users.constants import PERM_VIEW, PERM_DOWNLOAD

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

    def validate_file_name(self, value):
        # Sanitize filename - allow spaces
        return sanitize_input(value, allow_spaces=True)

class FileShareSerializer(serializers.ModelSerializer):
    file_name = serializers.CharField(source='file.file_name', read_only=True)
    
    class Meta:
        model = FileShare
        fields = ('id', 'file_name', 'shared_with_username', 'permission_type', 'created_at')
        read_only_fields = ('id', 'created_at')

class FileShareCreateSerializer(serializers.ModelSerializer):
    shared_with_username = serializers.CharField()
    permission_type = serializers.ChoiceField(choices=[PERM_VIEW, PERM_DOWNLOAD])

    class Meta:
        model = FileShare
        fields = ['shared_with_username', 'permission_type']

    def validate_shared_with_username(self, value):
        # Sanitize username - no spaces allowed
        value = sanitize_input(value, allow_spaces=False)
        request = self.context.get('request')
        if request and request.user.username == value:
            raise serializers.ValidationError("You cannot share a file with yourself")
        return value

class SharedFileSerializer(serializers.ModelSerializer):
    file_name = serializers.CharField(source='file.file_name')
    uploaded_by_username = serializers.CharField(source='file.uploaded_by.username')
    shared_by_username = serializers.CharField(source='shared_by.username')
    created_at = serializers.DateTimeField(source='file.created_at')

    class Meta:
        model = FileShare
        fields = [
            'id',
            'file_id',
            'file_name',
            'uploaded_by_username',
            'shared_by_username',
            'permission_type',
            'created_at'
        ]