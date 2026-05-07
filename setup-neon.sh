#!/bin/bash
# Neon Database Setup Script
# Run this ONCE after creating your Neon project

set -e

echo "🚀 SeniorSafe Neon Database Setup"
echo "=================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable not set!"
  echo ""
  echo "To set it:"
  echo "  export DATABASE_URL='postgresql://user:password@host/database?sslmode=require'"
  echo ""
  echo "Or add to server/.env:"
  echo "  DATABASE_URL=postgresql://user:password@host/database?sslmode=require"
  exit 1
fi

echo "✅ DATABASE_URL is configured"
echo ""

# Test connection
echo "🔍 Testing Neon connection..."
if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
  echo "✅ Successfully connected to Neon!"
else
  echo "❌ Failed to connect to Neon"
  echo "   Check your DATABASE_URL and firewall settings"
  exit 1
fi

echo ""
echo "📊 Running migrations..."
echo ""

# Run migrations
echo "1️⃣  Creating initial schema..."
psql "$DATABASE_URL" -f neon_migrations/001_initial_schema.sql > /dev/null
echo "   ✅ Schema created"

echo ""
echo "2️⃣  Adding user preferences..."
psql "$DATABASE_URL" -f neon_migrations/002_user_preferences.sql > /dev/null
echo "   ✅ User preferences added"

echo ""
echo "📋 Verifying tables..."
echo ""

# List all tables
psql "$DATABASE_URL" -c "\dt"

echo ""
echo "✅ All done! Your Neon database is ready."
echo ""
echo "Next steps:"
echo "1. Start backend: cd server && npm run dev"
echo "2. Start frontend: npm run dev"
echo "3. Test at http://localhost:5173/auth"
echo ""
