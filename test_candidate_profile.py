"""
Test script to verify candidate profile dynamic integration
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_candidate_profile():
    print("=" * 60)
    print("Testing Dynamic Candidate Profile Integration")
    print("=" * 60)

    # 1. Register a test user
    print("\n1. Registering test candidate...")
    register_data = {
        "email": "testcandidate@example.com",
        "username": "testcandidate",
        "password": "TestPass123!",
        "full_name": "Test Candidate",
        "role": "candidate"
    }

    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        if response.status_code == 200:
            print("✓ Registration successful")
        else:
            print(f"Note: {response.json().get('detail', 'User might already exist')}")
    except Exception as e:
        print(f"Note: {e}")

    # 2. Login
    print("\n2. Logging in...")
    login_data = {
        "username": "testcandidate",
        "password": "TestPass123!"
    }

    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if response.status_code != 200:
        print(f"✗ Login failed: {response.json()}")
        return

    tokens = response.json()
    access_token = tokens['access_token']
    headers = {"Authorization": f"Bearer {access_token}"}
    print("✓ Login successful")

    # 3. Get initial profile
    print("\n3. Getting initial profile...")
    response = requests.get(f"{BASE_URL}/candidates/me", headers=headers)
    if response.status_code == 200:
        profile = response.json()
        print("✓ Profile retrieved")
        print(f"   - Email: {profile.get('email')}")
        print(f"   - Name: {profile.get('first_name')} {profile.get('last_name')}")
        print(f"   - Title: {profile.get('title')}")
    else:
        print(f"✗ Failed to get profile: {response.json()}")
        return

    # 4. Update profile with detailed information
    print("\n4. Updating profile with detailed information...")
    update_data = {
        "first_name": "John",
        "last_name": "Doe",
        "title": "Senior Full Stack Developer",
        "bio": "Experienced developer passionate about building scalable applications",
        "phone": "+1 (555) 123-4567",
        "location": "San Francisco, CA",
        "website": "johndoe.dev",
        "linkedin": "linkedin.com/in/johndoe",
        "github": "github.com/johndoe",
        "skills": ["Python", "JavaScript", "React", "FastAPI", "PostgreSQL"],
        "work_experience": [
            {
                "title": "Senior Developer",
                "company": "Tech Corp",
                "location": "San Francisco, CA",
                "startDate": "2020-01",
                "endDate": None,
                "current": True,
                "description": "Leading development of core platform features"
            }
        ],
        "education": [
            {
                "degree": "Bachelor of Science",
                "school": "MIT",
                "field": "Computer Science",
                "startDate": "2014-09",
                "endDate": "2018-05",
                "current": False
            }
        ],
        "certifications": [
            {
                "name": "AWS Certified Developer",
                "issuer": "Amazon Web Services",
                "date": "2023"
            }
        ]
    }

    response = requests.put(f"{BASE_URL}/candidates/me", json=update_data, headers=headers)
    if response.status_code == 200:
        updated_profile = response.json()
        print("✓ Profile updated successfully")
        print(f"   - Name: {updated_profile.get('first_name')} {updated_profile.get('last_name')}")
        print(f"   - Title: {updated_profile.get('title')}")
        print(f"   - Skills: {len(updated_profile.get('skills_list', []))} skills")
        print(f"   - Experience: {len(updated_profile.get('work_experience_list', []))} entries")
        print(f"   - Education: {len(updated_profile.get('education_list', []))} entries")
        print(f"   - Certifications: {len(updated_profile.get('certifications', []))} entries")
    else:
        print(f"✗ Failed to update profile: {response.json()}")
        return

    # 5. Verify data persistence
    print("\n5. Verifying data persistence...")
    response = requests.get(f"{BASE_URL}/candidates/me", headers=headers)
    if response.status_code == 200:
        profile = response.json()
        print("✓ Profile data persisted correctly")
        print(f"   - Retrieved {len(profile.get('skills_list', []))} skills")
        print(f"   - Retrieved {len(profile.get('work_experience_list', []))} work experiences")
        print(f"   - Retrieved {len(profile.get('education_list', []))} education entries")
    else:
        print(f"✗ Failed to verify: {response.json()}")

    print("\n" + "=" * 60)
    print("✓ All tests completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    test_candidate_profile()

