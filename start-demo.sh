#!/bin/bash

echo "🚀 Starting CoursePath Demo Servers..."
echo "=================================="

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Kill any existing processes on the ports
echo "🧹 Cleaning up existing processes..."
if check_port 3001; then
    echo "   Stopping backend on port 3001..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
fi

if check_port 5173; then
    echo "   Stopping frontend on port 5173..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
fi

sleep 2

# Start backend
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:3001"
else
    echo "❌ Backend failed to start!"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 5

# Check if frontend is running
if curl -s -I http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:5173"
else
    echo "❌ Frontend failed to start!"
    exit 1
fi

echo ""
echo "🎉 CoursePath Demo is Ready!"
echo "================================"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "📊 Data Available:"
echo "   • 72 DePauw Programs (Majors & Minors)"
echo "   • 1,184 Courses"
echo "   • Real data scraped from DePauw website"
echo ""
echo "🎯 Demo Instructions:"
echo "   1. Open http://localhost:5173 in your browser"
echo "   2. Sign up/Login with Firebase"
echo "   3. Navigate to Requirements Browser"
echo "   4. Click on any major to see requirements"
echo "   5. Click on course codes to see details"
echo "   6. Navigate to Course Catalog for all courses"
echo ""
echo "⚠️  Keep this terminal open during your presentation!"
echo "🛑 Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Keep script running
wait
