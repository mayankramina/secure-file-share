from django.db import models
from users.models import User
from django.utils import timezone

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
