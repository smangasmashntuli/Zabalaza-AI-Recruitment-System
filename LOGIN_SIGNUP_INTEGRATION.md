# Login & Signup Integration Guide

## Overview
The frontend login and signup components are now fully connected to the FastAPI backend.

## Setup Instructions

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Ensure database is initialized
python ../init_db.py

# Start the backend server
python ../run.py
```
The backend will run on `http://localhost:8000`

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Start the React development server
npm start
```
The frontend will run on `http://localhost:3000`

## Features Implemented

### Login Component
- **Email/Username validation** - Accepts both email and username
- **Password validation** - Minimum 6 characters
- **Backend integration** - Connects to `/api/v1/auth/login`
- **Token storage** - Stores JWT tokens in localStorage
- **Error handling** - Displays API errors to users
- **Loading state** - Shows "Logging in..." during submission

### Signup Component
- **Full name validation** - Minimum 3 characters
- **Username validation** - Minimum 3 characters, unique
- **Email validation** - Valid email format, unique
- **Password validation** - Minimum 8 characters with uppercase, lowercase, and number
- **Confirm password** - Matches password field
- **Role selection** - Defaults to 'candidate'
- **Backend integration** - Connects to `/api/v1/auth/register`
- **Error handling** - Displays API errors (duplicate email/username)
- **Auto-redirect** - Switches to login after successful registration

## API Endpoints Used

### POST /api/v1/auth/login
**Request (Form Data):**
```
username: user@example.com (or username)
password: password123
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

### POST /api/v1/auth/register
**Request (JSON):**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "password": "Password123",
  "role": "candidate"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "role": "candidate",
  "is_active": true,
  "created_at": "2026-01-14T10:30:00"
}
```

## Testing the Integration

### Test Signup Flow
1. Open `http://localhost:3000`
2. Click "Sign up" link
3. Fill in the form:
   - Full Name: "Test User"
   - Username: "testuser"
   - Email: "test@example.com"
   - Password: "Test1234"
   - Confirm Password: "Test1234"
4. Click "Sign Up"
5. Should show success message and redirect to login

### Test Login Flow
1. Open `http://localhost:3000`
2. Fill in the login form:
   - Email: "test@example.com" (or "testuser")
   - Password: "Test1234"
3. Click "Login"
4. Should show success message
5. Check browser localStorage for tokens

### Check Stored Tokens
Open browser DevTools > Application > Local Storage > `http://localhost:3000`
You should see:
- `access_token`
- `refresh_token`
- `token_type`

## API Utilities Created

### `/frontend/src/api/config.js`
Contains API base URL and endpoint configurations.

### `/frontend/src/api/auth.js`
Authentication functions:
- `loginUser(email, password)` - Login user
- `registerUser(userData)` - Register new user
- `logoutUser()` - Clear tokens
- `getAccessToken()` - Get stored token
- `isAuthenticated()` - Check if user is logged in

### `/frontend/src/api/client.js`
Generic API client for authenticated requests:
- `get(url)` - GET request
- `post(url, body)` - POST request
- `put(url, body)` - PUT request
- `del(url)` - DELETE request

## Error Handling

### Common Errors

**"Email already registered"**
- User tries to signup with existing email
- Solution: Use different email or login instead

**"Username already taken"**
- User tries to signup with existing username
- Solution: Choose different username

**"Incorrect username or password"**
- Invalid credentials during login
- Solution: Check credentials or reset password

**"Inactive user"**
- User account is deactivated
- Solution: Contact administrator

## Next Steps

1. **Dashboard Integration** - Redirect to dashboard after successful login
2. **Protected Routes** - Use `isAuthenticated()` to protect routes
3. **Auto-logout** - Implement token expiration handling
4. **Password Reset** - Add forgot password functionality
5. **Profile Management** - Allow users to update their profiles

## Environment Variables

### Frontend (`.env`)
```
REACT_APP_API_URL=http://localhost:8000
```

### Backend (`.env`)
```
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

## Security Notes

- Passwords are hashed using bcrypt before storage
- JWT tokens are signed and verified
- CORS is enabled for frontend origin
- Tokens should be refreshed before expiration
- Use HTTPS in production

## Troubleshooting

### Backend not responding
1. Check if backend server is running on port 8000
2. Check database connection
3. Check console for errors

### CORS errors
1. Verify CORS middleware in `backend/app/main.py`
2. Check API_URL in frontend `.env`

### Login fails with valid credentials
1. Check database for user record
2. Verify password hash is correct
3. Check backend logs for errors

### Tokens not storing
1. Check browser console for errors
2. Verify localStorage is not disabled
3. Check API response includes tokens

