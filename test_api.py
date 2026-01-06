"""
Sample API Test Script
Run this after starting the server to test the endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_health():
    """Test health endpoint"""
    response = requests.get("http://localhost:8000/health")
    print("Health Check:", response.json())
    return response.status_code == 200

def test_register_user():
    """Test user registration"""
    data = {
        "email": "candidate@example.com",
        "username": "testcandidate",
        "password": "testpass123",
        "full_name": "Test Candidate",
        "role": "candidate"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    print("Register User:", response.status_code)
    if response.status_code == 201:
        print("User created:", response.json())
        return True
    else:
        print("Error:", response.json())
        return False

def test_login():
    """Test user login"""
    params = {
        "username": "testcandidate",
        "password": "testpass123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", params=params)
    print("Login:", response.status_code)
    if response.status_code == 200:
        token_data = response.json()
        print("Token received")
        return token_data["access_token"]
    else:
        print("Error:", response.json())
        return None

def test_create_job(token):
    """Test job creation (requires recruiter account)"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": "Senior Python Developer",
        "description": "We are looking for an experienced Python developer with expertise in FastAPI and ML.",
        "requirements": "5+ years Python, FastAPI, Machine Learning, SQL",
        "location": "Remote",
        "salary_min": 80000,
        "salary_max": 120000,
        "job_type": "full-time",
        "experience_level": "senior"
    }
    response = requests.post(f"{BASE_URL}/jobs", json=data, headers=headers)
    print("Create Job:", response.status_code)
    if response.status_code == 201:
        print("Job created:", response.json()["id"])
        return response.json()["id"]
    else:
        print("Error:", response.json())
        return None

def test_get_jobs():
    """Test getting all jobs"""
    response = requests.get(f"{BASE_URL}/jobs")
    print("Get Jobs:", response.status_code)
    if response.status_code == 200:
        jobs = response.json()
        print(f"Found {len(jobs)} jobs")
        return jobs
    return []

def test_upload_resume(token):
    """Test resume upload"""
    headers = {"Authorization": f"Bearer {token}"}
    # This would require an actual file
    print("Resume upload requires actual file - skip for now")
    return True

def test_get_profile(token):
    """Test getting candidate profile"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/candidates/me", headers=headers)
    print("Get Profile:", response.status_code)
    if response.status_code == 200:
        print("Profile:", response.json())
        return True
    else:
        print("Error:", response.json())
        return False

if __name__ == "__main__":
    print("=== AI Job Recruitment System - API Tests ===\n")

    # Test health
    print("1. Testing health endpoint...")
    test_health()
    print()

    # Test registration
    print("2. Testing user registration...")
    test_register_user()
    print()

    # Test login
    print("3. Testing login...")
    token = test_login()
    print()

    if token:
        # Test profile
        print("4. Testing get profile...")
        test_get_profile(token)
        print()

        # Test jobs
        print("5. Testing get jobs...")
        test_get_jobs()
        print()

    print("\n=== Tests Complete ===")
    print("Note: Some tests require specific user roles or uploaded files")

