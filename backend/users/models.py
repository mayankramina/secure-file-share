from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from .constants import USER_ROLE_CHOICES, DEFAULT_ROLE, ROLE_ADMIN

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
        user = self.create_user(
            username=username,
            password=password,
            role=ROLE_ADMIN
        )
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return user

class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(
        max_length=5,
        choices=USER_ROLE_CHOICES,
        default=DEFAULT_ROLE
    )
    mfa_secret = models.CharField(max_length=32, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    is_superuser = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []  # List of fields required when creating a superuser

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'

    def __str__(self):
        return self.username

    @property
    def is_staff(self):
        return self.role == ROLE_ADMIN

    @is_staff.setter
    def is_staff(self, value):
        if value:
            self.role = ROLE_ADMIN
        else:
            self.role = DEFAULT_ROLE