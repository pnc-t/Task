@echo off
echo 🚀 Starting development servers...
echo.

echo Starting backend...
start "Backend" cmd /k "cd backend && npm run start:dev"

echo Starting frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Both servers are starting in separate windows