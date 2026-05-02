@echo off
setlocal enabledelayedexpansion

echo ============================================================ > backend_errors.log
echo BACKEND DIAGNOSTIC REPORT >> backend_errors.log
echo ============================================================ >> backend_errors.log
echo. >> backend_errors.log

echo [TEST 1] Python Version >> backend_errors.log
python --version >> backend_errors.log 2>&1
echo. >> backend_errors.log

echo [TEST 2] FastAPI Import >> backend_errors.log
python -c "import fastapi; print('OK')" >> backend_errors.log 2>&1
echo. >> backend_errors.log

echo [TEST 3] Uvicorn Import >> backend_errors.log
python -c "import uvicorn; print('OK')" >> backend_errors.log 2>&1
echo. >> backend_errors.log

echo [TEST 4] SQLAlchemy Import >> backend_errors.log
python -c "import sqlalchemy; print('OK')" >> backend_errors.log 2>&1
echo. >> backend_errors.log

echo [TEST 5] PyMySQL Import >> backend_errors.log
python -c "import pymysql; print('OK')" >> backend_errors.log 2>&1
echo. >> backend_errors.log

echo [TEST 6] Backend Config Import >> backend_errors.log
python -c "from backend.app.config import settings; print('OK')" >> backend_errors.log 2>&1
echo. >> backend_errors.log

echo [TEST 7] Backend Main Import >> backend_errors.log
python -c "from backend.app.main import app; print('OK')" >> backend_errors.log 2>&1
echo. >> backend_errors.log

echo Done! Check backend_errors.log
type backend_errors.log

