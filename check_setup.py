"""
Installation and Setup Checker
Run this to verify your environment is properly configured
"""
import sys
import subprocess

def check_python_version():
    """Check Python version"""
    version = sys.version_info
    print(f"✓ Python {version.major}.{version.minor}.{version.micro}")
    if version.major < 3 or (version.major == 3 and version.minor < 10):
        print("  ⚠ Warning: Python 3.10+ recommended")
        return False
    return True

def check_package(package_name, import_name=None):
    """Check if a package is installed"""
    if import_name is None:
        import_name = package_name
    try:
        __import__(import_name)
        print(f"✓ {package_name}")
        return True
    except ImportError:
        print(f"✗ {package_name} - NOT INSTALLED")
        return False

def check_env_file():
    """Check if .env file exists"""
    import os
    if os.path.exists('.env'):
        print("✓ .env file exists")
        return True
    else:
        print("✗ .env file - MISSING")
        print("  Copy .env.example to .env and configure it")
        return False

def main():
    print("=" * 50)
    print("AI Job Recruitment System - Environment Check")
    print("=" * 50)
    print()

    # Check Python version
    print("1. Python Version:")
    check_python_version()
    print()

    # Check core packages
    print("2. Core Packages:")
    packages = [
        ("fastapi", "fastapi"),
        ("uvicorn", "uvicorn"),
        ("sqlalchemy", "sqlalchemy"),
        ("pymysql", "pymysql"),
        ("pydantic", "pydantic"),
        ("python-dotenv", "dotenv"),
        ("python-jose", "jose"),
        ("passlib", "passlib"),
    ]

    all_installed = True
    for pkg_name, import_name in packages:
        if not check_package(pkg_name, import_name):
            all_installed = False
    print()

    # Check AI/ML packages
    print("3. AI/ML Packages:")
    ml_packages = [
        ("sentence-transformers", "sentence_transformers"),
        ("scikit-learn", "sklearn"),
        ("torch", "torch"),
        ("transformers", "transformers"),
        ("pandas", "pandas"),
        ("numpy", "numpy"),
    ]

    for pkg_name, import_name in ml_packages:
        if not check_package(pkg_name, import_name):
            all_installed = False
    print()

    # Check document processing
    print("4. Document Processing:")
    doc_packages = [
        ("PyPDF2", "PyPDF2"),
        ("python-docx", "docx"),
    ]

    for pkg_name, import_name in doc_packages:
        if not check_package(pkg_name, import_name):
            all_installed = False
    print()

    # Check configuration
    print("5. Configuration:")
    check_env_file()
    print()

    # Summary
    print("=" * 50)
    if all_installed and check_env_file():
        print("✅ All checks passed! You're ready to run the application.")
        print()
        print("Next steps:")
        print("  1. Configure .env with your database credentials")
        print("  2. Create the database: CREATE DATABASE job_recruitment_db;")
        print("  3. Run: python init_db.py")
        print("  4. Run: python seed_data.py (optional)")
        print("  5. Run: python run.py")
    else:
        print("❌ Some checks failed. Please install missing packages:")
        print("   pip install -r requirements.txt")
    print("=" * 50)

if __name__ == "__main__":
    main()

