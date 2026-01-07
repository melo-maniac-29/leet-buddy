# Setup script for Windows
# Run this after cloning the repository

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "🚀 LeetBuddy Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if Docker is installed
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "   Visit: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker found" -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit .env file with your GitHub OAuth credentials" -ForegroundColor Yellow
    Write-Host "   Get them at: https://github.com/settings/developers" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter after you've updated the .env file"
}

# Start Docker containers
Write-Host ""
Write-Host "🐳 Starting Docker containers..." -ForegroundColor Cyan
docker-compose up -d

# Wait for PostgreSQL to be ready
Write-Host ""
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run migration
Write-Host ""
Write-Host "📦 Migrating database from JSON to PostgreSQL..." -ForegroundColor Cyan
python migrate.py

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Your LeetBuddy instance is running!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Cyan
Write-Host "   API: http://localhost:8000"
Write-Host "   API Docs: http://localhost:8000/docs"
Write-Host "   Database: localhost:5432"
Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Install the Chrome extension (in ./extension folder)"
Write-Host "   2. Configure GitHub OAuth in extension"
Write-Host "   3. Start contributing!"
Write-Host ""
Write-Host "🛑 To stop: docker-compose down" -ForegroundColor Yellow
Write-Host "🔄 To restart: docker-compose restart" -ForegroundColor Yellow
Write-Host "📊 View logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host ""
