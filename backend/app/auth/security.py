"""
==============================================================================
🛡️ SECURITY & DEPENDENCY INJECTION GUARDS
==============================================================================
FastAPI Concept:
1. `OAuth2PasswordBearer`: Extracts the bearer token from the `Authorization` header.
2. `Depends(get_current_user)`: Dependency injection function that enforces authentication.
   If an endpoint specifies `current_user: User = Depends(get_current_user)`, FastAPI will:
   - Extract the JWT from incoming headers.
   - Decode and validate the signature.
   - Fetch the corresponding user from the database.
   - Raise HTTP 401 Unauthorized if invalid or missing.
3. `Depends(get_current_admin)`: Role-based access control (RBAC) ensuring only administrators
   can trigger restricted actions.
==============================================================================
"""

import bcrypt
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models.user import User
from .jwt_handler import decode_access_token

# Scheme to extract `Authorization: Bearer <token>`
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    """Hash plaintext password using standard bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext password against bcrypt hash"""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    FastAPI dependency that enforces authenticated user access.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email_or_username = payload["sub"]

    # Query user from SQLite database
    stmt = select(User).where((User.email == email_or_username) | (User.username == email_or_username))
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    FastAPI dependency for endpoints that work for both guests and logged-in users.
    """
    if not token:
        return None
    try:
        return await get_current_user(token=token, db=db)
    except HTTPException:
        return None


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    FastAPI dependency requiring 'ROLE_ADMIN' permission.
    """
    if current_user.role != "ROLE_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to perform this action"
        )
    return current_user
