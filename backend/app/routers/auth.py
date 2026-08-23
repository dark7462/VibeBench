"""
==============================================================================
🔑 AUTHENTICATION ROUTER
==============================================================================
FastAPI Concept:
1. Endpoint Declarations: `@router.post(...)` declares route path and HTTP method.
2. Request Body Validation: `request: LoginRequest` instructs FastAPI to automatically
   parse and validate JSON request payloads against the Pydantic schema.
3. Status Codes & Error Handling: `HTTPException(status_code=400, detail="...")`
   returns standard JSON error objects with clear HTTP status codes.
==============================================================================
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..config import settings
from ..database import get_db
from ..models.user import User, RegisterRequest, LoginRequest, GoogleLoginRequest, GoogleRegisterRequest, TokenResponse
from ..auth.jwt_handler import create_access_token
from ..auth.security import hash_password, verify_password
from ..auth.google import verify_google_token

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Registers a new user account with hashed password.
    """
    email_clean = request.email.strip().lower()

    # Check if user already exists
    stmt = select(User).where((User.email == email_clean) | (User.username == email_clean))
    result = await db.execute(stmt)
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username is already registered"
        )

    # Determine role (admin email or default admin username gets ROLE_ADMIN)
    role = "ROLE_USER"
    if email_clean in ["admin", "anu870906@gmail.com", settings.DEFAULT_ADMIN_EMAIL.lower()]:
        role = "ROLE_ADMIN"

    new_user = User(
        email=email_clean,
        username=email_clean,
        name=request.name.strip(),
        hashed_password=hash_password(request.password),
        profession=request.profession.strip() if request.profession else "Developer",
        role=role
    )
    db.add(new_user)
    await db.commit()

    return {"message": "Registration successful", "email": email_clean}


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticates a user via email/username and password, returning a JWT token.
    Supports default admin: admin / 1234578.
    """
    identifier = request.email.strip().lower()

    stmt = select(User).where((User.email == identifier) | (User.username == identifier))
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password"
        )

    token = create_access_token({
        "sub": user.email,
        "name": user.name,
        "role": user.role
    })

    return TokenResponse(
        token=token,
        email=user.email,
        name=user.name,
        role=user.role,
        profession=user.profession,
        registered=True
    )


@router.post("/google")
async def google_login(request: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Handles Google OAuth sign-in. Returns token if user exists, or flags 'registered: false'
    so the user can complete profile registration.
    """
    google_user = await verify_google_token(request.idToken)
    if not google_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID token"
        )

    email = google_user.email.lower()
    stmt = select(User).where((User.email == email) | (User.username == email))
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        # Prompt client to collect profession / name
        return {
            "registered": False,
            "email": email,
            "name": google_user.name
        }

    token = create_access_token({
        "sub": user.email,
        "name": user.name,
        "role": user.role
    })

    return {
        "registered": True,
        "token": token,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "profession": user.profession
    }


@router.post("/google/register")
async def google_register(request: GoogleRegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Completes registration for a new user signing in via Google.
    """
    google_user = await verify_google_token(request.idToken)
    if not google_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID token"
        )

    email = google_user.email.lower()
    stmt = select(User).where((User.email == email) | (User.username == email))
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        role = "ROLE_ADMIN" if email in ["admin", "anu870906@gmail.com", settings.DEFAULT_ADMIN_EMAIL.lower()] else "ROLE_USER"
        user = User(
            email=email,
            username=email,
            name=request.name.strip() or google_user.name,
            hashed_password=hash_password(str(uuid.uuid4())),
            profession=request.profession.strip(),
            role=role
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token({
        "sub": user.email,
        "name": user.name,
        "role": user.role
    })

    return {
        "registered": True,
        "token": token,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "profession": user.profession
    }


@router.get("/config")
async def get_auth_config():
    """
    Returns public OAuth configuration (Google Client ID) to the frontend.
    """
    return {
        "clientId": settings.VIBEBENCH_GOOGLE_CLIENT_ID
    }
