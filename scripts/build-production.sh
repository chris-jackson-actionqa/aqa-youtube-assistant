#!/bin/bash
# Script Name: build-production.sh
# Purpose: Build the application for production deployment
# Usage: ./scripts/build-production.sh

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    
    # Check for frontend directory
    if [ ! -d "frontend" ]; then
        log_error "Frontend directory not found"
        log_error "Are you in the correct project root?"
        exit 1
    fi
    
    # Check for backend directory
    if [ ! -d "backend" ]; then
        log_error "Backend directory not found"
        log_error "Are you in the correct project root?"
        exit 1
    fi
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        log_error "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check for npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        log_error "Please install npm (usually comes with Node.js)"
        exit 1
    fi
    
    # Check for Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed"
        log_error "Please install Python 3.8+ from https://www.python.org/"
        exit 1
    fi
    
    log_info "✓ All prerequisites met"
}

# Build frontend
build_frontend() {
    log_step "Building frontend for production..."
    
    (
        cd frontend || { log_error 'Failed to change to frontend directory'; exit 1; }
        
        # Check for production environment file
        if [ ! -f ".env.production" ]; then
            log_error "Frontend production environment file not found"
            log_error "Expected to find frontend/.env.production"
            exit 1
        fi
        
        # Install dependencies (including dev dependencies needed for build)
        log_info "Installing frontend dependencies..."
        npm install --production=false
        
        # Build Next.js application with production environment
        # Next.js automatically loads .env.production when NODE_ENV=production
        log_info "Building Next.js application for production..."
        NODE_ENV=production npm run build
        
        log_info "✓ Frontend build complete"
    )
}

# Prepare backend
prepare_backend() {
    log_step "Preparing backend for production..."
    
    (
        cd backend || { log_error 'Failed to change to backend directory'; exit 1; }
        
        # Create production virtual environment if it doesn't exist
        if [ ! -d "venv-prod" ]; then
            log_info "Creating production virtual environment..."
            python3 -m venv venv-prod
        else
            log_info "Production virtual environment already exists, using existing"
        fi
        
        # Use virtual environment's pip directly (no activation needed)
        log_info "Using virtual environment's pip to install dependencies..."
        
        # Upgrade pip
        log_info "Upgrading pip..."
        ./venv-prod/bin/pip install --upgrade pip --quiet
        
        # Install production dependencies
        log_info "Installing backend production dependencies..."
        ./venv-prod/bin/pip install -r requirements.txt --quiet
        
        log_info "✓ Backend preparation complete"
    )
}

# Main script logic
main() {
    echo -e "${GREEN}🏗️  Building AQA YouTube Assistant for Production...${NC}"
    
    # Check prerequisites
    check_prerequisites
    
    # Build frontend
    build_frontend
    
    # Prepare backend
    prepare_backend
    
    # Success message
    echo ""
    log_info "✅ Production build complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./scripts/deploy-production.sh"
    echo "  2. Run: ./scripts/start-production.sh"
    echo -e "${YELLOW}Note: The above scripts will be added in upcoming issues (see Epic #123).${NC}"
    echo ""
}

# Run main function
main "$@"
