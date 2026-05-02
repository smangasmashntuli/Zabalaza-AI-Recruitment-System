#!/usr/bin/env python
# -*- coding: utf-8 -*-
import requests
import json
import sys
import io

# Fix encoding for Windows terminal
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:8000/api/v1"

def register_test_user():
    """Register a test user if not already registered"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": "resumetest@example.com",
                "username": "resumetest",
                "password": "TestPassword123!",
                "full_name": "Resume Test User"
            }
        )
        if response.status_code == 200:
            print("[OK] Test user registered successfully")
        elif response.status_code in (400, 409):
            print("[OK] Test user already exists")
        else:
            print(f"[WARN] Registration response: {response.status_code}")
            print(f"  Details: {response.text}")
    except Exception as e:
        print(f"[ERR] Registration failed: {e}")
        return False
    return True

def login_test_user():
    """Login and get access token"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data={
                "username": "resumetest",
                "password": "TestPassword123!"
            }
        )
        if response.status_code == 200:
            token = response.json().get('access_token')
            print("[OK] Test user logged in successfully")
            return token
        else:
            print(f"[ERR] Login failed: {response.status_code}")
            print(f"  Details: {response.text}")
            return None
    except Exception as e:
        print(f"[ERR] Login failed: {e}")
        return None

def upload_resume(token):
    """Upload resume and verify parsing"""
    try:
        with open('test_resume.docx', 'rb') as f:
            files = {
                'file': (
                    'resume.docx',
                    f,
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                )
            }
            headers = {'Authorization': f'Bearer {token}'}

            response = requests.post(
                f"{BASE_URL}/uploads/resume",
                files=files,
                headers=headers
            )

        if response.status_code == 200:
            result = response.json()
            print("[OK] Resume uploaded successfully")
            print(f"  Parsed resume_text length: {len(result.get('resume_text', ''))}")
            print(f"  Skills extracted: {result.get('skills', [])}")
            print(f"  Education: {result.get('education', [])}")
            print(f"  Experience: {result.get('experience', [])}")
            return result
        else:
            print(f"[ERR] Resume upload failed: {response.status_code}")
            print(f"  Details: {response.text}")
            return None
    except Exception as e:
        print(f"[ERR] Resume upload failed: {e}")
        return None

def get_candidate_profile(token):
    """Get updated candidate profile"""
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(
            f"{BASE_URL}/candidates/me",
            headers=headers
        )

        if response.status_code == 200:
            profile = response.json()
            print("[OK] Candidate profile retrieved")
            print(f"  Resume text length: {len(profile.get('resume_text', ''))}")
            print(f"  Profile summary: {profile.get('profile_summary', 'N/A')[:100]}...")
            print(f"  Has embedding: {bool(profile.get('embedding'))}")
            print(f"  Skills: {profile.get('skills', [])}")
            return profile
        else:
            print(f"[ERR] Failed to get profile: {response.status_code}")
            return None
    except Exception as e:
        print(f"[ERR] Failed to get profile: {e}")
        return None

def get_job_matches(token):
    """Get job matches based on candidate profile"""
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(
            f"{BASE_URL}/candidates/me/matches?top_k=5",
            headers=headers
        )

        if response.status_code == 200:
            matches = response.json()
            print("[OK] Job matches retrieved")
            print(f"  Total matches: {len(matches)}")
            if matches:
                for i, job in enumerate(matches[:3], 1):
                    print(f"  {i}. {job.get('title', 'N/A')} @ {job.get('company', 'N/A')}")
                    print(f"     Location: {job.get('location', 'N/A')}")
                    print(f"     Match score: {job.get('score', 'N/A')}")
            return matches
        else:
            print(f"[ERR] Failed to get matches: {response.status_code}")
            print(f"  Details: {response.text}")
            return []
    except Exception as e:
        print(f"[ERR] Failed to get matches: {e}")
        return []

def main():
    print("\n" + "=" * 60)
    print("RESUME UPLOAD & CANDIDATE PROFILE TEST")
    print("=" * 60)

    print("\n[1/5] Registering test user...")
    if not register_test_user():
        return False

    print("\n[2/5] Logging in test user...")
    token = login_test_user()
    if not token:
        return False

    print("\n[3/5] Uploading resume...")
    resume_result = upload_resume(token)
    if not resume_result:
        return False

    print("\n[4/5] Retrieving candidate profile...")
    profile = get_candidate_profile(token)
    if not profile:
        return False

    print("\n[5/5] Retrieving job recommendations...")
    matches = get_job_matches(token)

    print("\n" + "=" * 60)
    print("[OK] RESUME UPLOAD TEST COMPLETED SUCCESSFULLY")
    print("=" * 60)
    return True

if __name__ == "__main__":
    main()







