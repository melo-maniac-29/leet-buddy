#!/bin/bash
# Setup script for LeetBuddy
# Run this after cloning the repository

set -e

echo "=================================="
echo "🚀 LeetBuddy Setup"
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker found"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your GitHub OAuth credentials"
    echo "   Get them at: https://github.com/settings/developers"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

# Start Docker containers
echo ""
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Run migration
echo ""
echo "📦 Migrating database from JSON to PostgreSQL..."
python3 migrate.py

echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "🎯 Your LeetBuddy instance is running!"
echo ""
echo "📍 Access Points:"
echo "   API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Database: localhost:5432"
echo ""
echo "📚 Next Steps:"
echo "   1. Install the Chrome extension (in ./extension folder)"
echo "   2. Configure GitHub OAuth in extension"
echo "   3. Start contributing!"
echo ""
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
echo "📊 View logs: docker-compose logs -f"
echo ""
