#!/bin/bash
# Script Name: deploy-production.sh
# Purpose: Deploy the built application to production directory
# Usage: ./scripts/deploy-production.sh

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Production directory
PROD_DIR="$HOME/aqa-youtube-assistant-prod"

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}==>${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check we're in project root
    if [ ! -f "README.md" ]; then
        log_error "Must run from project root directory"
        log_error "Current directory: $(pwd)"
        log_error "Expected to find README.md in current directory"
        exit 1
    fi
    
    # Check if frontend build exists
    if [ ! -d "frontend/.next" ]; then
        log_error "Frontend not built. Run ./scripts/build-production.sh first"
        log_error "Expected to find frontend/.next directory"
        exit 1
    fi
    
    # Check for production environment files
    if [ ! -f "backend/.env.production" ]; then
        log_error "Backend production environment file not found"
        log_error "Expected to find backend/.env.production"
        exit 1
    fi
    
    if [ ! -f "frontend/.env.production" ]; then
        log_error "Frontend production environment file not found"
        log_error "Expected to find frontend/.env.production"
        exit 1
    fi
    
    log_info "✓ All prerequisites met"
}

# Create production directory
create_production_directory() {
    log_step "Creating production directory..."
    
    if [ -d "$PROD_DIR" ]; then
        log_warning "Production directory already exists at $PROD_DIR"
        log_info "Will update existing deployment"
    else
        log_info "Creating new production directory at $PROD_DIR"
    fi
    
    mkdir -p "$PROD_DIR"
    log_info "✓ Production directory ready"
}

# Copy backend files
copy_backend() {
    log_step "Copying backend files..."
    
    # Create backend directory
    mkdir -p "$PROD_DIR/backend"
    
    # Copy application code
    log_info "Copying backend application code..."
    cp -r backend/app "$PROD_DIR/backend/"
    
    # Copy alembic migration files
    log_info "Copying alembic migration files..."
    cp -r backend/alembic "$PROD_DIR/backend/"
    cp backend/alembic.ini "$PROD_DIR/backend/"
    
    # Copy requirements
    log_info "Copying requirements.txt..."
    cp backend/requirements.txt "$PROD_DIR/backend/"
    
    # Copy and rename production environment file
    log_info "Setting up production environment configuration..."
    cp backend/.env.production "$PROD_DIR/backend/.env"
    
    # Set up production virtual environment
    log_info "Creating production virtual environment..."
    python3 -m venv "$PROD_DIR/backend/venv-prod"
    log_info "Installing backend requirements..."
    "$PROD_DIR/backend/venv-prod/bin/pip" install --upgrade pip --quiet
    "$PROD_DIR/backend/venv-prod/bin/pip" install -r "$PROD_DIR/backend/requirements.txt" --quiet
    
    log_info "✅ Backend copied successfully"
}

# Copy frontend files
copy_frontend() {
    log_step "Copying frontend files..."
    
    # Create frontend directory
    mkdir -p "$PROD_DIR/frontend"
    
    # Copy Next.js build
    log_info "Copying Next.js build..."
    cp -r frontend/.next "$PROD_DIR/frontend/"
    
    # Copy public assets
    log_info "Copying public assets..."
    cp -r frontend/public "$PROD_DIR/frontend/"
    
    # Copy configuration files
    log_info "Copying configuration files..."
    cp frontend/package.json "$PROD_DIR/frontend/"
    cp frontend/package-lock.json "$PROD_DIR/frontend/"
    cp frontend/next.config.ts "$PROD_DIR/frontend/"
    
    # Copy and rename production environment file
    log_info "Setting up production environment configuration..."
    cp frontend/.env.production "$PROD_DIR/frontend/.env"
    
    # Install production dependencies
    log_info "Installing frontend dependencies with npm ci..."
    (cd "$PROD_DIR/frontend" && npm ci)
    
    log_info "✅ Frontend copied successfully"
}

# Initialize production database
initialize_database() {
    log_step "Initializing production database..."
    
    # Use subshell to automatically return to original directory
    (
        cd "$PROD_DIR/backend" || { log_error "Failed to change to backend directory"; exit 1; }
        
        # Activate virtual environment and run migrations
        log_info "Running database migrations..."
        source venv-prod/bin/activate
        
        # Load environment variables from .env file and export them
        set -a
        source .env
        set +a
        
        # Run alembic migrations
        alembic upgrade head
        
        # Deactivate virtual environment
        deactivate
    )
    
    log_info "✅ Database initialized successfully"
}

# Create directories for logs and PIDs (for future scripts)
create_runtime_directories() {
    log_step "Creating runtime directories..."
    
    mkdir -p "$PROD_DIR/logs"
    mkdir -p "$PROD_DIR/pids"
    
    log_info "✓ Runtime directories created"
}

# Main script logic
main() {
    echo -e "${GREEN}🚀 Deploying AQA YouTube Assistant to Production...${NC}"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Create production directory
    create_production_directory
    
    # Copy backend
    copy_backend
    
    # Copy frontend
    copy_frontend
    
    # Create runtime directories
    create_runtime_directories
    
    # Initialize database
    initialize_database
    
    # Success message
    echo ""
    log_info "✅ Deployment complete!"
    echo ""
    echo "Production directory: $PROD_DIR"
    echo ""
    echo "Next steps:"
    echo "  Run: ./scripts/start-production.sh"
    echo ""
}

# Run main function
main "$@"
