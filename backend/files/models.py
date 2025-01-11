from django.db import models
from users.models import User
from django.utils import timezone
import uuid

class File(models.Model):
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=512)  # Stores the path to encrypted file
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='uploaded_files'
    )
    encrypted_key = models.TextField()  # Stores the encrypted AES key
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']
        db_table = 'files' 
        indexes = [
            models.Index(fields=['uploaded_by', 'created_at']),
            models.Index(fields=['file_name']),
        ]

    def __str__(self):
        return f"{self.file_name} (uploaded by {self.uploaded_by.username})"

class FileShare(models.Model):
    PERMISSION_CHOICES = [
        ('VIEW', 'View'),
        ('DOWNLOAD', 'Download'),
    ]

    file = models.ForeignKey(
        'File',  # Using string to avoid circular import
        on_delete=models.CASCADE,
        related_name='shares'
    )
    shared_with_username = models.CharField(
        max_length=150,  # Match User model username max_length
        db_index=True  # Add index for better query performance
    )
    shared_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='shared_files'
    )
    permission_type = models.CharField(
        max_length=8,
        choices=PERMISSION_CHOICES,
        default='VIEW'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'file_shares'
        # Ensure a file can only be shared once with a specific user
        unique_together = ['file', 'shared_with_username']
        # Order by most recent first
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file.file_name} shared with {self.shared_with_username}"

def generate_uuid():
    return str(uuid.uuid4())

class ShareableLink(models.Model):
    file = models.ForeignKey(
        'File',
        on_delete=models.CASCADE,
        related_name='shareable_links'
    )
    token = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,  # Add index for better query performance
        default=generate_uuid  # Use the function name without parentheses
    )
    expiration_time = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_links'
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'shareable_links'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['file', 'created_at']),
            models.Index(fields=['created_by', 'created_at']),
        ]

    def __str__(self):
        return f"Link for {self.file.file_name} ({self.token})"

    @property
    def is_expired(self):
        if self.expiration_time is None:
            return False
        return timezone.now() > self.expiration_time
