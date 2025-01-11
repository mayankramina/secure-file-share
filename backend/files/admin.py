from django.contrib import admin
from .models import File, FileShare

class FileShareInline(admin.TabularInline):
    model = FileShare
    extra = 1
    fields = ('shared_with_username', 'permission_type', 'shared_by', 'created_at')
    readonly_fields = ('created_at',)

@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'uploaded_by', 'created_at', 'get_share_count')
    list_filter = ('created_at', 'uploaded_by')
    search_fields = ('file_name', 'uploaded_by__username')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    inlines = [FileShareInline]
    
    def get_share_count(self, obj):
        return obj.shares.count()
    get_share_count.short_description = 'Shares'

@admin.register(FileShare)
class FileShareAdmin(admin.ModelAdmin):
    list_display = ('file', 'shared_with_username', 'shared_by', 'permission_type', 'created_at')
    list_filter = ('permission_type', 'created_at')
    search_fields = ('file__file_name', 'shared_with_username', 'shared_by__username')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
