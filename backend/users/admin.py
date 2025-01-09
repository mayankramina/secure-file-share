from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    # What columns to show in the user list view
    list_display = ('username', 'role', 'created_at')
    
    # Fields to use when creating a new user
    add_fieldsets = (
        (None, {
            'fields': ('username', 'password1', 'password2', 'role')
        }),
    )

    # Fields to use when editing an existing user
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('User Information', {'fields': ('role')}),
        ('Dates', {'fields': ('created_at',)}),
    )

admin.site.register(User, CustomUserAdmin)
