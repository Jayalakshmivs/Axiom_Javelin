#!/bin/bash
# ============================================================
# AXIOM JAVELIN — Backend Startup Script
# Run this from the backend/ directory
# ============================================================

echo "🚀 Starting AXIOM JAVELIN Backend..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Install dependencies if needed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
fi

# Start the server
echo "✅ Backend starting on http://0.0.0.0:8000"
echo "📡 Android Emulator connects via: http://10.0.2.2:8000"
echo "📡 Real Device connects via: http://<YOUR_LAN_IP>:8000"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
