"""
==============================================================================
👤 USER MODEL & SCHEMAS
==============================================================================
FastAPI Concept:
1. SQLAlchemy Model: Defines the database table structure (`users` in SQLite).
2. Pydantic Schemas: Define the shape of incoming requests (`RegisterRequest`,
   `LoginRequest`) and outgoing responses (`UserResponse`, `TokenResponse`).
   This guarantees automatic validation, serialization, and Swagger documentation.
==============================================================================
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import declarative_base
from pydantic import BaseModel, EmailStr, Field

# Shared SQLAlchemy Base
Base = declarative_base()


class User(Base):
    """
    SQLAlchemy Database Table for storing registered users and admins.
    """
    __tablename__ = "users"

    email = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    profession = Column(String, nullable=True, default="Developer")
    role = Column(String, nullable=False, default="ROLE_USER")  # "ROLE_USER" or "ROLE_ADMIN"
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "email": self.email,
            "username": self.username,
            "name": self.name,
            "profession": self.profession,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# ==============================================================================
# PYDANTIC SCHEMAS (Request / Response validation)
# ==============================================================================

class RegisterRequest(BaseModel):
    """Payload for regular user sign up"""
    name: str = Field(..., min_length=1, description="Full name of user")
    email: str = Field(..., description="Email address or username")
    password: str = Field(..., min_length=6, description="Password (min 6 chars)")
    profession: Optional[str] = Field(default="Developer", description="User's profession or title")


class LoginRequest(BaseModel):
    """Payload for user sign in (accepts email or username)"""
    email: str = Field(..., description="User email or username ('admin')")
    password: str = Field(..., description="User password")


class GoogleLoginRequest(BaseModel):
    """Payload when user signs in with Google One-Tap or Google Button"""
    idToken: str = Field(..., description="Google JWT ID Token")


class GoogleRegisterRequest(BaseModel):
    """Payload when completing registration for first-time Google sign-in"""
    idToken: str = Field(..., description="Google JWT ID Token")
    name: str = Field(..., description="Full Name")
    profession: str = Field(..., description="Profession or Role")


class TokenResponse(BaseModel):
    """Response returned upon successful authentication"""
    token: str
    email: str
    name: str
    role: str
    profession: Optional[str] = None
    registered: bool = True
