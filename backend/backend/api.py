from ninja_extra import NinjaExtraAPI
from users.api import router as users_router

api = NinjaExtraAPI(
    title="RansomNegotiator API",
    version="1.0",
    docs_url=None,
)

api.add_router("/accounts/", users_router)
