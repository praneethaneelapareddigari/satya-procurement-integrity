#!/bin/bash
# SATYA Setup Script for Mac
# Run this from the project root: bash setup.sh

echo "🔷 SATYA — Procurement Integrity System"
echo "Setting up your development environment..."
echo ""

# Backend setup
echo "📦 Setting up Python backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy .env
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Created .env file — add your ANTHROPIC_API_KEY to backend/.env"
fi

echo ""
echo "✅ Backend setup complete!"
echo ""

# Frontend setup
echo "📦 Setting up React frontend..."
cd ../frontend
npm install

echo ""
echo "✅ Frontend setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 To run SATYA:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm start"
echo ""
echo "Then open: http://localhost:3000"
echo "API docs: http://localhost:8000/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
