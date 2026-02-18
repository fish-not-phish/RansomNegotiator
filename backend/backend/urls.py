"""
URL configuration for RansomNegotiator backend project.
"""
from django.urls import path, include
from django.contrib import admin
from .api import api

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('chat.urls')),
    path('api/', api.urls),
    path('accounts/', include('allauth.urls')),    # Allauth URLs (login, signup, etc.)
    path('accounts/auth/', include('users.urls')),  # Auth gate view
]