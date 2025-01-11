from django.contrib import admin
from .models import File

@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'uploaded_by', 'created_at')
    list_filter = ('created_at', 'uploaded_by')
    search_fields = ('file_name', 'uploaded_by__username')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
