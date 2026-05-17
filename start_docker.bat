@echo off
REM ═══════════════════════════════════════════════════════════════════
REM  AXIOM JAVELIN — Docker Startup Script (Windows)
REM  Builds and launches all containers: MongoDB, Backend, Frontend
REM ═══════════════════════════════════════════════════════════════════

echo.
echo  ██████████████████████████████████████████████
echo   AXIOM JAVELIN — Starting Docker Environment
echo  ██████████████████████████████████████████████
echo.

REM Check Docker is available
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Docker is not installed or not in PATH.
    echo  Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

REM Check Docker daemon is running
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Docker daemon is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo  [1/3] Stopping any existing containers...
docker compose down --remove-orphans 2>nul

echo.
echo  [2/3] Building images and starting all services...
echo        (This will take 5-15 minutes on first run — PyTorch is large)
echo.
docker compose up --build -d

if %ERRORLEVEL% neq 0 (
    echo.
    echo  [ERROR] Docker Compose failed. Check the logs above.
    pause
    exit /b 1
)

echo.
echo  [3/3] Waiting for services to become healthy...
timeout /t 10 /nobreak >nul

echo.
echo  ████████████████████████████████████████████████████████████
echo   AXIOM JAVELIN IS RUNNING
echo  ────────────────────────────────────────────────────────────
echo   Main App (Frontend):  http://localhost
echo   Backend API:          http://localhost:8000/api/health
echo   Swagger / API Docs:   http://localhost/docs
echo                         http://localhost:8000/docs
echo   MongoDB:              localhost:27017
echo  ████████████████████████████████████████████████████████████
echo.
echo  To view live logs:    docker compose logs -f
echo  To stop everything:   docker compose down
echo.
pause
