#!/bin/bash
# Authentication Setup & Debugging Script for SeniorSafe
# This script helps diagnose and fix Google OAuth authentication issues

set -e

echo "🔐 SeniorSafe Google OAuth Diagnostic & Setup Script"
echo "======================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if environment files exist
echo "📋 Checking environment configuration..."
echo ""

if [ -f "/workspaces/senior-safe/server/.env" ]; then
    echo -e "${GREEN}✓${NC} Server .env file exists"
else
    echo -e "${RED}✗${NC} Server .env file missing at: /workspaces/senior-safe/server/.env"
    echo "   Create it and set: GOOGLE_CLIENT_ID and DATABASE_URL"
fi

if [ -f "/workspaces/senior-safe/.env" ]; then
    echo -e "${GREEN}✓${NC} Frontend .env file exists"
elif [ -f "/workspaces/senior-safe/.env.local" ]; then
    echo -e "${YELLOW}⚠${NC} Frontend .env.local exists (Vite will use it)"
elif [ -f "/workspaces/senior-safe/.env.development" ]; then
    echo -e "${YELLOW}⚠${NC} Frontend .env.development exists (Vite will use it)"
else
    echo -e "${RED}✗${NC} Frontend .env file missing"
    echo "   Create /workspaces/senior-safe/.env and set: VITE_GOOGLE_CLIENT_ID and VITE_API_BASE_URL"
fi

echo ""

# Step 2: Check if required env vars are set
echo "🔑 Checking environment variables..."
echo ""

# Check server env vars
if grep -q "GOOGLE_CLIENT_ID" /workspaces/senior-safe/server/.env 2>/dev/null; then
    SERVER_GOOGLE_ID=$(grep "^GOOGLE_CLIENT_ID" /workspaces/senior-safe/server/.env | cut -d'=' -f2 | xargs)
    if [[ "$SERVER_GOOGLE_ID" != "your-"* ]] && [ -n "$SERVER_GOOGLE_ID" ]; then
        echo -e "${GREEN}✓${NC} Server GOOGLE_CLIENT_ID is set"
    else
        echo -e "${YELLOW}⚠${NC} Server GOOGLE_CLIENT_ID is set but not configured (still placeholder)"
    fi
else
    echo -e "${RED}✗${NC} Server GOOGLE_CLIENT_ID not found"
fi

if grep -q "^DATABASE_URL" /workspaces/senior-safe/server/.env 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Server DATABASE_URL is set"
else
    echo -e "${RED}✗${NC} Server DATABASE_URL not found - authentication will fail"
fi

echo ""

# Step 3: Check API connectivity
echo "🌐 Checking backend connectivity..."
echo ""

if command -v curl &> /dev/null; then
    # Check if backend is running
    if timeout 2 curl -s http://localhost:3001/api/health &>/dev/null; then
        echo -e "${GREEN}✓${NC} Backend is running on http://localhost:3001"
        
        # Get health status
        HEALTH=$(curl -s http://localhost:3001/api/health)
        DB_CONFIGURED=$(echo "$HEALTH" | grep -o '"databaseConfigured":[^,}]*' | cut -d':' -f2)
        
        if [ "$DB_CONFIGURED" = "true" ]; then
            echo -e "${GREEN}✓${NC} Database is configured"
        else
            echo -e "${RED}✗${NC} Database is not configured - set DATABASE_URL in server/.env"
        fi
    else
        echo -e "${YELLOW}⚠${NC} Backend not running at http://localhost:3001"
        echo "   Start it with: cd server && npm start"
    fi
else
    echo "   (curl not available - skipping health check)"
fi

echo ""

# Step 4: Check frontend
echo "🖥️  Checking frontend..."
echo ""

if command -v npm &> /dev/null; then
    if timeout 2 curl -s http://localhost:5173 &>/dev/null; then
        echo -e "${GREEN}✓${NC} Frontend is running on http://localhost:5173"
    else
        echo -e "${YELLOW}⚠${NC} Frontend not running at http://localhost:5173"
        echo "   Start it with: npm run dev"
    fi
fi

echo ""

# Step 5: Provide setup instructions
echo "📚 Setup Instructions:"
echo "====================="
echo ""
echo "1️⃣  Get Google OAuth Credentials:"
echo "   • Go to: https://console.cloud.google.com/"
echo "   • Create OAuth 2.0 Client ID (Web Application)"
echo "   • Add authorized origins:"
echo "     - http://localhost:5173"
echo "     - http://localhost:3001"
echo "   • Copy the Client ID and Secret"
echo ""

echo "2️⃣  Create/Update /workspaces/senior-safe/server/.env:"
echo "   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com"
echo "   DATABASE_URL=postgresql://..."
echo ""

echo "3️⃣  Create/Update /workspaces/senior-safe/.env:"
echo "   VITE_GOOGLE_CLIENT_ID=same-client-id.apps.googleusercontent.com"
echo "   VITE_API_BASE_URL=http://localhost:3001"
echo ""

echo "4️⃣  Start the servers:"
echo "   Terminal 1: cd server && npm start"
echo "   Terminal 2: npm run dev"
echo ""

echo "5️⃣  Test the flow:"
echo "   • Open http://localhost:5173"
echo "   • Click 'Sign in with Google'"
echo "   • Check browser console for errors"
echo ""

echo "🐛 Debugging Commands:"
echo "====================="
echo ""
echo "# Check backend authentication logs"
echo "curl -X POST http://localhost:3001/api/auth/google \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"user\": {\"id\": \"test\", \"email\": \"test@example.com\"}}' | jq"
echo ""

echo "# Check CORS headers"
echo "curl -i -X OPTIONS http://localhost:3001/api/auth/google"
echo ""

echo "# Check environment variables are loaded"
echo "grep GOOGLE_CLIENT_ID /workspaces/senior-safe/server/.env"
echo ""

echo "# View server logs (if running)"
echo "ps aux | grep 'node server.js'"
echo ""

echo "✅ Setup complete! Follow the instructions above to fix authentication errors."
