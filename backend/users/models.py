from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)
    is_admin = models.BooleanField(default=False)
    # Per-user API settings
    api_key = models.CharField(max_length=500, blank=True, default="")
    base_url = models.CharField(max_length=500, default="https://api.openai.com/v1")
    model = models.CharField(max_length=100, default="gpt-4o")

    def __str__(self):
        return f"Profile for {self.user.username if self.user else 'Unknown'}"