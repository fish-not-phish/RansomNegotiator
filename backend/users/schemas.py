from ninja import Schema


class AuthStatusOut(Schema):
    isLoggedIn: bool


class MessageOut(Schema):
    success: bool
    message: str


class MeOut(Schema):
    id: int
    username: str
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    isAdmin: bool
    # User API settings
    hasApiKey: bool = False
    base_url: str = "https://api.openai.com/v1"
    model: str = "gpt-4o"


class PasswordChangeIn(Schema):
    current_password: str
    new_password: str


class UserSettingsIn(Schema):
    api_key: str = ""
    base_url: str = "https://api.openai.com/v1"
    model: str = "gpt-4o"


class UserSettingsOut(Schema):
    api_key: str  # Masked version
    base_url: str
    model: str