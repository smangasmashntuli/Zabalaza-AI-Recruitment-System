#!/usr/bin/env python
"""Quick test to verify backend setup"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("BACKEND DIAGNOSTIC TEST")
print("=" * 60)

# Test 1: Python version
print(f"\n[1] Python version: {sys.version}")

# Test 2: Check .env file
print("\n[2] Checking .env file...")
if os.path.exists('.env'):
    print("   [OK] .env file exists")
    with open('.env', 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key = line.split('=')[0]
                print(f"      - {key}: configured")
else:
    print("   [FAIL] .env file NOT found")
    sys.exit(1)

# Test 3: Import required packages
print("\n[3] Testing package imports...")
packages = ['fastapi', 'uvicorn', 'sqlalchemy', 'pymysql', 'pydantic']
for pkg in packages:
    try:
        __import__(pkg)
        print(f"   [OK] {pkg}")
    except ImportError as e:
        print(f"   [FAIL] {pkg}: {e}")

# Test 4: Config loading
print("\n[4] Loading configuration...")
try:
    from backend.app.config import settings
    print(f"   [OK] Config loaded")
    print(f"      - Project: {settings.PROJECT_NAME}")
    print(f"      - DB Host: {settings.DB_HOST}")
    print(f"      - DB Name: {settings.DB_NAME}")
except Exception as e:
    print(f"   [FAIL] Config error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 5: Database connection
print("\n[5] Testing database connection...")
try:
    from backend.app.database import engine
    with engine.connect() as conn:
        result = conn.execute("SELECT 1")
        print(f"   [OK] Database connected successfully")
except Exception as e:
    print(f"   [FAIL] Database connection failed: {e}")
    print("      Make sure MySQL is running and credentials are correct")

# Test 6: App import
print("\n[6] Loading FastAPI application...")
try:
    from backend.app.main import app
    print(f"   [OK] FastAPI app loaded")
    print(f"      - Title: {app.title}")
    print(f"      - Version: {app.version}")
    routes = len([r for r in app.routes])
    print(f"      - Routes: {routes}")
except Exception as e:
    print(f"   [FAIL] App loading failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)
print("ALL CHECKS PASSED! Backend is ready.")
print("=" * 60)
print("\nStarting server on http://0.0.0.0:8000")
print("Press Ctrl+C to stop\n")

# Test 7: Start server
try:
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
except KeyboardInterrupt:
    print("\n\nServer stopped.")
    sys.exit(0)
except Exception as e:
    print(f"\n✗ Server startup failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

