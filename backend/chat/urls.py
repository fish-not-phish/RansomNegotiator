"""
URL configuration for chat app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('groups', views.get_available_groups, name='groups'),
    path('chats', views.list_chats, name='list_chats'),
    path('chats/search', views.search_chats, name='search_chats'),
    path('chats/create', views.create_chat, name='create_chat'),
    path('chats/<uuid:chat_id>', views.get_chat, name='get_chat'),
    path('chats/<uuid:chat_id>/delete', views.delete_chat, name='delete_chat'),
    path('chat', views.chat, name='chat'),
    path('chat/async', views.chat_async, name='chat_async'),
    path('chat/status/<str:task_id>', views.chat_status, name='chat_status'),
    path('init', views.init_chat, name='init'),
]