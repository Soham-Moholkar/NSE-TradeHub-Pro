# Quick Start Script for NSE Stock Analysis Dashboard
# Run this script to set up and start both backend and frontend

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "NSE Stock Analysis Dashboard - Quick Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version
    Write-Host "✓ $pythonVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found! Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found! Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "BACKEND SETUP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Backend setup
Set-Location backend

Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
if (!(Test-Path "venv")) {
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "✓ Virtual environment already exists" -ForegroundColor Green
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -q -r requirements.txt
Write-Host "✓ Dependencies installed" -ForegroundColor Green

Write-Host "Creating .env file..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "✓ .env file created" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host "Initializing database..." -ForegroundColor Yellow
python -m app.init_db
Write-Host "✓ Database initialized" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "FRONTEND SETUP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Frontend setup
Set-Location frontend

Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install --silent
Write-Host "✓ Dependencies installed" -ForegroundColor Green

Write-Host "Creating .env.local file..." -ForegroundColor Yellow
if (!(Test-Path ".env.local")) {
    Copy-Item .env.local.example .env.local
    Write-Host "✓ .env.local file created" -ForegroundColor Green
} else {
    Write-Host "✓ .env.local file already exists" -ForegroundColor Green
}

Set-Location ..

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start Backend (in terminal 1):" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "   uvicorn app.main:app --reload --port 8000" -ForegroundColor White
Write-Host ""
Write-Host "2. Start Frontend (in terminal 2):" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Open your browser:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Happy Stock Analyzing! 📈" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
