"""
==============================================================================
🌐 GOOGLE OAUTH VERIFICATION
==============================================================================
FastAPI Concept:
Verifies Google OAuth2 ID tokens sent from the frontend Google Sign-In SDK
using an asynchronous HTTP client (`httpx`). Supports development mock tokens
(`mock-admin-token` / `mock-user-token`) for instant local testing without live Google credentials.
==============================================================================
"""

from typing import Optional, Dict
import httpx
from pydantic import BaseModel


class GoogleUser(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None


async def verify_google_token(id_token: str) -> Optional[GoogleUser]:
    """
    Verifies a Google ID token against Google's tokeninfo endpoint.
    """
    if not id_token or not id_token.strip():
        return None

    # Development & Demo Mock Tokens
    if id_token == "mock-admin-token":
        return GoogleUser(
            email="admin@vibebench.ai",
            name="Admin (Mock)",
            picture=None
        )
    if id_token == "mock-user-token":
        return GoogleUser(
            email="visitor@vibebench.org",
            name="Guest (Mock)",
            picture=None
        )

    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                email = data.get("email")
                if email:
                    return GoogleUser(
                        email=email.lower().strip(),
                        name=data.get("name", email.split("@")[0]),
                        picture=data.get("picture")
                    )
    except Exception as e:
        print(f"Error validating Google ID token: {e}")

    return None
