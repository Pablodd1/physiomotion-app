#!/bin/bash
# Database Initialization Script for PhysioMotion
# This script sets up the PostgreSQL database with schema and seed data

set -e

echo "======================================"
echo "PhysioMotion Database Setup"
echo "======================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Using default local PostgreSQL."
    echo "   Set DATABASE_URL environment variable to use a different database."
    echo ""
    echo "   Example:"
    echo "   export DATABASE_URL=postgresql://user:password@localhost:5432/physiomotion"
    echo ""
    
    # Try to connect to default local PostgreSQL
    if command -v psql &> /dev/null; then
        echo "Attempting to connect to local PostgreSQL..."
        if ! psql -c "SELECT 1;" postgres &> /dev/null; then
            echo "❌ Cannot connect to PostgreSQL. Please ensure:"
            echo "   1. PostgreSQL is installed and running"
            echo "   2. Database 'physiomotion' exists, or you have CREATEDB privileges"
            exit 1
        fi
        
        # Create database if it doesn't exist
        if ! psql -lqt | cut -d \| -f 1 | grep -qw physiomotion; then
            echo "Creating database 'physiomotion'..."
            createdb physiomotion
        fi
        
        export DATABASE_URL="postgresql://localhost:5432/physiomotion"
    else
        echo "❌ psql not found. Please install PostgreSQL client."
        exit 1
    fi
fi

echo ""
echo "📊 Database URL: ${DATABASE_URL//:*@/:***@}"
echo ""

# Function to run SQL file
run_sql() {
    local file=$1
    local description=$2
    
    echo "📝 $description..."
    if psql "$DATABASE_URL" -f "$file" &> /tmp/db_setup.log; then
        echo "   ✅ Success"
        return 0
    else
        echo "   ❌ Failed"
        cat /tmp/db_setup.log
        return 1
    fi
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Run schema
echo ""
echo "🔧 Creating database schema..."
echo "======================================"
run_sql "database/schema.sql" "Creating tables and indexes"

# Run seed data
echo ""
echo "🌱 Seeding data..."
echo "======================================"
run_sql "database/seed.sql" "Inserting exercises and default data"

# Verify setup
echo ""
echo "✅ Verifying setup..."
echo "======================================"

# Count exercises
EXERCISE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM exercises;" | xargs)
echo "   📚 Exercises: $EXERCISE_COUNT"

# Count CPT codes
CPT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM cpt_codes;" | xargs)
echo "   💰 CPT Codes: $CPT_COUNT"

# Check tables
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
echo "   📋 Tables: $TABLE_COUNT"

echo ""
echo "======================================"
echo "✅ Database setup complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "   1. Set DATABASE_URL in your environment"
echo "   2. Set JWT_SECRET for authentication"
echo "   3. Run: npm run railway"
echo ""
echo "Default admin credentials:"
echo "   Email: admin@physiomotion.local"
echo "   Password: Admin123!"
echo ""
