from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
from files.models import File, FileShare

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'role', 'created_at', 'is_active')
    list_filter = ('role', 'is_active', 'created_at')
    search_fields = ('username',)
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {
            'fields': ('username', 'password')
        }),
        ('Permissions', {
            'fields': (
                'role',
                'is_active',
                'is_staff',
                'is_superuser',
            )
        }),
        ('MFA Settings', {
            'fields': ('mfa_secret',)
        }),
        ('Important dates', {
            'fields': ('created_at', 'last_login')
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username',
                'password1',
                'password2',
                'role',
                'is_staff',
                'is_active'
            )
        }),
    )
    
    readonly_fields = ('created_at', 'last_login')
