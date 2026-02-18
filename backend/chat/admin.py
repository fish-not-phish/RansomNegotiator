from django.contrib import admin
from .models import ChatSession, Message


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'group_name', 'title', 'revenue', 'created_at', 'updated_at']
    list_filter = ['group_name', 'created_at', 'updated_at']
    search_fields = ['user__username', 'group_name', 'title']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        (None, {
            'fields': ('id', 'user', 'group_name', 'title')
        }),
        ('API Settings', {
            'fields': ('api_key', 'base_url', 'model'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('revenue', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'role', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['content', 'session__group_name']
    readonly_fields = ['id', 'created_at']
    fieldsets = (
        (None, {
            'fields': ('id', 'session', 'role', 'content')
        }),
        ('Timestamp', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )