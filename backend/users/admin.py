from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_admin', 'base_url', 'model']
    list_filter = ['is_admin']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['api_key']  # Hide API key for security
    fieldsets = (
        (None, {
            'fields': ('user', 'is_admin')
        }),
        ('API Settings', {
            'fields': ('api_key', 'base_url', 'model'),
            'classes': ('collapse',)
        }),
    )