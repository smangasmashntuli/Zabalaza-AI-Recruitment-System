#!/usr/bin/env python
"""Test backend startup"""
import sys
print("Python version:", sys.version)

try:
    import uvicorn
    print("✓ uvicorn imported")
except Exception as e:
    print(f"✗ uvicorn error: {e}")
    sys.exit(1)

try:
    from backend.app.main import app
    print("✓ app imported successfully")
except Exception as e:
    print(f"✗ app error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n Starting server on http://0.0.0.0:8000...")
uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

