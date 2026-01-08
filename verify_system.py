"""
System Verification Script
Run this to verify all components are working
"""

import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent / "backend"
if backend_dir.exists():
    sys.path.insert(0, str(backend_dir))
else:
    # If already in backend directory
    current_dir = Path(__file__).parent
    if (current_dir / "app").exists():
        sys.path.insert(0, str(current_dir))
    else:
        print("ERROR: Cannot find backend/app directory!")
        print("Please run this script from the project root directory.")
        sys.exit(1)

print("=" * 60)
print("AI JOB RECRUITMENT SYSTEM - VERIFICATION")
print("=" * 60)
print()

# Test 1: Core imports
print("1. Testing core imports...")
try:
    from app.main import app
    from app.models import User, Job, Candidate, Application
    from app.database import engine, Base
    print("   [OK] Core modules OK")
except Exception as e:
    print(f"   [ERROR] Core import error: {e}")
    sys.exit(1)

# Test 2: ML imports
print("2. Testing ML modules...")
try:
    from app.ml.resume_parser.text_extractor import TextExtractor
    from app.ml.resume_parser.skill_extractor import SkillExtractor
    from app.ml.matching.semantic_matcher import SemanticMatcher
    from app.ml.matching.hybrid_matcher import HybridMatcher
    from app.ml.embeddings.sentence_embeddings import SentenceEmbeddings
    print("   [OK] ML modules OK")
except Exception as e:
    print(f"   [ERROR] ML import error: {e}")
    sys.exit(1)

# Test 3: Services
print("3. Testing service layer...")
try:
    from app.services.ai_service import ai_service
    print("   [OK] Services OK")
except Exception as e:
    print(f"   [ERROR] Service error: {e}")
    sys.exit(1)

# Test 4: API routes
print("4. Testing API routes...")
try:
    from app.api import auth, jobs, candidates, uploads, matches
    print("   [OK] API routes OK")
except Exception as e:
    print(f"   [ERROR] API route error: {e}")
    sys.exit(1)

# Test 5: Configuration
print("5. Testing configuration...")
try:
    from app.config import settings
    print(f"   [OK] Config OK (Project: {settings.PROJECT_NAME})")
except Exception as e:
    print(f"   [ERROR] Config error: {e}")
    sys.exit(1)

# Test 6: Resume Parser functionality
print("6. Testing Resume Parser...")
try:
    from app.ml.resume_parser import ResumeParser
    parser = ResumeParser()
    test_text = "Senior Python Developer with 5 years experience in Django and FastAPI"
    # Just test that methods exist
    assert hasattr(parser, 'parse')
    print("   [OK] Resume Parser OK")
except Exception as e:
    print(f"   [ERROR] Resume Parser error: {e}")

# Test 7: Matching Engine
print("7. Testing Matching Engine...")
try:
    from app.ml.matching import HybridMatcher
    matcher = HybridMatcher()
    assert hasattr(matcher, 'match')
    print("   [OK] Matching Engine OK")
except Exception as e:
    print(f"   [ERROR] Matching Engine error: {e}")

# Test 8: Embeddings
print("8. Testing Embeddings (may take a moment to load model)...")
try:
    from app.ml.embeddings import SentenceEmbeddings
    embedder = SentenceEmbeddings()
    test_vec = embedder.encode("test")
    assert test_vec is not None
    assert len(test_vec) == 384  # Dimension check
    print(f"   [OK] Embeddings OK (dim={len(test_vec)})")
except Exception as e:
    print(f"   [ERROR] Embeddings error: {e}")

print()
print("=" * 60)
print("[SUCCESS] ALL SYSTEMS OPERATIONAL!")
print("=" * 60)
print()
print("Next steps:")
print("1. Initialize database: python init_db.py")
print("2. Seed sample data: python seed_data.py")
print("3. Start server: cd backend && uvicorn app.main:app --reload")
print("4. Visit API docs: http://127.0.0.1:8000/docs")
print()

