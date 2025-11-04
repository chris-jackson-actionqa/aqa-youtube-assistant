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
    
    cd frontend
    
    # Install dependencies (including dev dependencies needed for build)
    log_info "Installing frontend dependencies..."
    npm install --production=false
    
    # Build Next.js application
    log_info "Building Next.js application..."
    npm run build
    
    log_info "✓ Frontend build complete"
    
    cd ..
}

# Prepare backend
prepare_backend() {
    log_step "Preparing backend for production..."
    
    cd backend
    
    # Create production virtual environment if it doesn't exist
    if [ ! -d "venv-prod" ]; then
        log_info "Creating production virtual environment..."
        python3 -m venv venv-prod
    else
        log_info "Production virtual environment already exists, using existing"
    fi
    
    # Activate virtual environment
    log_info "Activating virtual environment..."
    source venv-prod/bin/activate
    
    # Upgrade pip
    log_info "Upgrading pip..."
    pip install --upgrade pip --quiet
    
    # Install production dependencies
    log_info "Installing backend production dependencies..."
    pip install -r requirements.txt --quiet
    
    log_info "✓ Backend preparation complete"
    
    cd ..
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
    echo ""
}

# Run main function
main "$@"
