"""
Django models for chat persistence.
"""
from django.db import models
from django.contrib.auth.models import User
import uuid
import random


def generate_revenue():
    """Generate a random revenue value between $10M and $10B."""
    # Generate a random revenue in millions, then convert to the appropriate format
    # Using a log distribution to get more realistic values
    revenue_millions = random.uniform(10, 10000)  # $10M to $10B
    if revenue_millions >= 1000:
        return f"${revenue_millions/1000:.1f}B"
    else:
        return f"${revenue_millions:.0f}M"


class ChatSession(models.Model):
    """Represents a chat session with a ransomware group."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    group_name = models.CharField(max_length=255)
    title = models.CharField(max_length=255, blank=True, default="")
    api_key = models.CharField(max_length=500, blank=True, default="")
    base_url = models.CharField(max_length=500, default="https://api.openai.com/v1")
    model = models.CharField(max_length=100, default="gpt-4o")
    company_name = models.CharField(max_length=255, blank=True, default="")
    revenue = models.CharField(max_length=50, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat with {self.group_name}"

    def save(self, *args, **kwargs):
        if not self.revenue:
            self.revenue = generate_revenue()
        super().save(*args, **kwargs)


class Message(models.Model):
    """Represents a single message in a chat session."""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, related_name='messages', on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."