from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.dependencies import get_db
from ..core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from ..models import User, UserRole, Candidate
from ..schemas import UserCreate, Token, User as UserSchema
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=user_data.role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # If candidate, create candidate profile
    if user.role == UserRole.CANDIDATE:
        candidate = Candidate(user_id=user.id)
        db.add(candidate)
        db.commit()

    return user


@router.post("/login", response_model=Token)
def login(username: str, password: str, db: Session = Depends(get_db)):
    """Login and get access token."""
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == username) | (User.email == username)
    ).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    # Create access and refresh tokens
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

