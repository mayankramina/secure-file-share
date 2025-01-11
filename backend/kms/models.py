from django.db import models
from users.models import User

class KeyPair(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='key_pair')
    public_key = models.TextField()
    private_key = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'key_pairs'
