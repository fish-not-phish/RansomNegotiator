from ninja import Router
from django.middleware.csrf import get_token
from django.http import HttpRequest
from .schemas import *
from .models import UserProfile
from .auth import session_mfa_auth

router = Router(tags=["auth"])

# ======================
# CSRF
# ======================

@router.get("/csrf", response=dict)
def get_csrf(request: HttpRequest):
    """
    Fetch CSRF token for frontend (Next.js, etc.)
    """
    return {"csrfToken": get_token(request)}


# ======================
# Auth status
# ======================

@router.get("/status", response=AuthStatusOut)
def auth_status(request: HttpRequest):
    return {"isLoggedIn": request.user.is_authenticated}

@router.get("/me", response=MeOut, auth=session_mfa_auth)
def me(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.auth)
    u = request.auth
    return {
        "id": u.id,
        "username": getattr(u, "get_username")() if hasattr(u, "get_username") else u.username,
        "email": getattr(u, "email", None),
        "first_name": getattr(u, "first_name", None),
        "last_name": getattr(u, "last_name", None),
        "isAdmin": profile.is_admin,
        # User API settings
        "hasApiKey": bool(profile.api_key),
        "base_url": profile.base_url or "https://api.openai.com/v1",
        "model": profile.model or "gpt-4o",
    }


@router.post("/change-password", response=MessageOut, auth=session_mfa_auth)
def change_password(request, payload: PasswordChangeIn):
    """Change user password"""
    user = request.auth

    # Verify current password
    if not user.check_password(payload.current_password):
        return {"success": False, "message": "Current password is incorrect"}

    # Validate new password length
    if len(payload.new_password) < 8:
        return {"success": False, "message": "New password must be at least 8 characters"}

    # Set new password
    user.set_password(payload.new_password)
    user.save()

    return {"success": True, "message": "Password changed successfully"}


# ======================
# User Settings (API keys)
# ======================

@router.get("/settings", response=UserSettingsOut, auth=session_mfa_auth)
def get_user_settings(request: HttpRequest):
    """Get user API settings (with masked API key)"""
    profile, _ = UserProfile.objects.get_or_create(user=request.auth)

    # Mask the API key - show only first 4 and last 4 characters
    masked_key = "****"
    if profile.api_key:
        if len(profile.api_key) > 8:
            masked_key = profile.api_key[:4] + "****" + profile.api_key[-4:]
        else:
            masked_key = "****"

    return {
        "api_key": masked_key,
        "base_url": profile.base_url or "https://api.openai.com/v1",
        "model": profile.model or "gpt-4o",
    }


@router.put("/settings", response=MessageOut, auth=session_mfa_auth)
def update_user_settings(request: HttpRequest, payload: UserSettingsIn):
    """Update user API settings"""
    profile, _ = UserProfile.objects.get_or_create(user=request.auth)

    profile.api_key = payload.api_key
    profile.base_url = payload.base_url
    profile.model = payload.model
    profile.save()

    return {"success": True, "message": "Settings updated successfully"}