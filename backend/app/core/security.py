from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from passlib.context import CryptContext

from ..config import settings

# Use direct bcrypt hashing/checking to avoid passlib+bcrypt compatibility issues.
fallback_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    if not hashed_password:
        return False

    # Most existing records use bcrypt hashes ($2a$/$2b$/$2y$).
    if hashed_password.startswith("$2"):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except ValueError:
            return False

    # Fallback for any non-bcrypt legacy hashes.
    try:
        return fallback_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None
