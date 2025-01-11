from django.db import models
from users.models import User

class KeyPair(models.Model):
    username = models.CharField(
        max_length=150, 
        db_index=True 
    )
    public_key = models.TextField()
    private_key = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'key_pairs'

class KeyAccess(models.Model):
    key_owner_username = models.CharField(
        max_length=150, 
        db_index=True 
    )
    shared_with_username = models.CharField(
        max_length=150, 
        db_index=True 
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'key_access'
        unique_together = ('key_owner_username', 'shared_with_username')