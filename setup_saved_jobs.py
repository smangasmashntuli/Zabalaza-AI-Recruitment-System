#!/usr/bin/env python
"""
Quick Setup Script for Saved Jobs Feature
Applies all necessary database migrations and verifies the system is ready
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

def run_migrations():
    """Run all database migrations"""
    print("=" * 60)
    print("SAVED JOBS FEATURE - DATABASE SETUP")
    print("=" * 60)
    print()
    
    # Step 1: Run the migration script
    print("Step 1: Running database migrations...")
    print("-" * 60)
    os.system("python migrate_db.py")
    print()
    
    # Step 2: Verify the changes
    print("Step 2: Verifying database changes...")
    print("-" * 60)
    
    try:
        from backend.app.database import engine
        from sqlalchemy import inspect
        
        inspector = inspect(engine)
        if not inspector.has_table('saved_jobs'):
            print("❌ ERROR: saved_jobs table does not exist!")
            return False
        
        columns = {col['name'] for col in inspector.get_columns('saved_jobs')}
        required_columns = {'id', 'candidate_id', 'job_id', 'source', 'external_job_id', 'job_data', 'saved_at'}
        
        missing = required_columns - columns
        if missing:
            print(f"❌ ERROR: Missing columns in saved_jobs: {missing}")
            return False
        
        print("✓ saved_jobs table structure verified")
        print(f"  Columns: {', '.join(sorted(columns))}")
        print()
        
    except Exception as e:
        print(f"❌ ERROR: Could not verify database: {e}")
        return False
    
    # Step 3: Verify model imports
    print("Step 3: Verifying code changes...")
    print("-" * 60)
    
    try:
        from backend.app.models import SavedJob
        from backend.app.api.candidates import save_job_for_current_candidate
        print("✓ Updated models and API endpoints imported successfully")
        print()
    except ImportError as e:
        print(f"❌ ERROR: Could not import updated code: {e}")
        return False
    
    # Step 4: Summary
    print("=" * 60)
    print("✓ SETUP COMPLETE - SAVED JOBS FEATURE READY!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Restart the backend: python run.py")
    print("2. Test the save functionality:")
    print("   - Open Find Jobs")
    print("   - Click on a job")
    print("   - Click Save button")
    print("   - Verify it saves and shows 'Saved'")
    print("3. Check Saved Jobs view to see all saved jobs")
    print()
    print("For more details, see SAVED_JOBS_FIX.md")
    print()
    
    return True

if __name__ == "__main__":
    try:
        success = run_migrations()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ SETUP FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

