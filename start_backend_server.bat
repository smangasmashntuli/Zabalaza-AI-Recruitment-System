@echo off
echo Starting Backend Server on Port 8000...
echo.
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

