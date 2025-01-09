from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, username, password, role):
        if not username:
            raise ValueError('Username is required')
        user = self.model(
            username=username,
            role=role,
            created_at=timezone.now()
        )
        user.set_password(password)  # This handles password hashing
        user.save()
        return user

    def create_superuser(self, username, password):
        # This method is needed to create admin users
        user = self.create_user(
            username=username,
            password=password,
            role='ADMIN'
        )
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return user

class User(AbstractBaseUser):
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(
        max_length=5,
        choices=[
            ('ADMIN', 'Admin'),
            ('USER', 'User'),
            ('GUEST', 'Guest')
        ],
        default='USER'
    )
    mfa_secret = models.CharField(max_length=32, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    # These two fields are required for Django admin
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'username'