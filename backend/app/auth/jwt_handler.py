"""
==============================================================================
🔐 JWT TOKEN HANDLER
==============================================================================
FastAPI Concept:
JSON Web Tokens (JWT) allow stateless user authentication. When a user logs in,
we encode their user info (email, name, role) and expiration into a signed token.
On subsequent requests, FastAPI extracts and decodes the token from the
`Authorization: Bearer <token>` header to authenticate the user.
==============================================================================
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import jwt
from ..config import settings


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a cryptographically signed JWT access token containing the payload data.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.JWT_EXPIRATION_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.VIBEBENCH_JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and verifies a JWT token. Returns the payload dictionary if valid, or None if expired/tampered.
    """
    try:
        payload = jwt.decode(
            token,
            settings.VIBEBENCH_JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None
