from rest_framework import serializers
from .models import User
from utils.sanitize import sanitize_input
import re
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from .constants import ROLE_USER, ROLE_GUEST

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'role', 'mfa_secret', 'created_at')
        read_only_fields = ('created_at')

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ('username', 'password', 'role')
    
    def validate_username(self, value):
        # Sanitize username - no spaces allowed
        value = sanitize_input(value, allow_spaces=False)
        
        # Username length check
        if len(value) < 3 or len(value) > 30:
            raise serializers.ValidationError(
                "Username must be between 3 and 30 characters long."
            )
        
        # Check for valid characters (alphanumeric, underscores, hyphens)
        if not re.match(r'^[a-zA-Z0-9_-]+$', value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, underscores, and hyphens."
            )
        
        # Check for existing username (case-insensitive)
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already exists.")
            
        # Prevent common username patterns that might be used for impersonation
        forbidden_patterns = ['admin', 'administrator', 'support', 'system']
        if any(pattern in value.lower() for pattern in forbidden_patterns):
            raise serializers.ValidationError(
                "Username contains forbidden words."
            )
            
        return value
    
    def validate_password(self, value):
        # Sanitize password - spaces allowed
        value = sanitize_input(value, allow_spaces=True)
        
        # Length check
        if len(value) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long."
            )
            
        # Complexity checks
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError(
                "Password must contain at least one uppercase letter."
            )
            
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError(
                "Password must contain at least one lowercase letter."
            )
            
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError(
                "Password must contain at least one number."
            )
            
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError(
                "Password must contain at least one special character."
            )
            
        # Check for common passwords
        common_passwords = [
            'password123', 'admin123', '12345678', 'qwerty123',
            'letmein123', 'welcome123', 'monkey123', 'football123'
        ]
        if value.lower() in common_passwords:
            raise serializers.ValidationError(
                "This password is too common. Please choose a different one."
            )
            
        # Use Django's password validation
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
            
        # Check for username in password
        username = self.initial_data.get('username', '')
        if username.lower() in value.lower():
            raise serializers.ValidationError(
                "Password cannot contain your username."
            )
            
        return value

    def validate_role(self, value):
        if value not in [ROLE_USER, ROLE_GUEST]:
            raise serializers.ValidationError("Role must be either USER or GUEST.")
        return value

    def create(self, validated_data):
        # Use the custom create_user method from UserManager
        return User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            role=validated_data['role']
        )