#!/bin/bash

# Production Setup Script for Pałka MTM
# This script helps set up production environment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production.local exists
if [ ! -f .env.production.local ]; then
    log_info "Creating .env.production.local from env.example..."
    cp env.example .env.production.local
    log_warning "Please edit .env.production.local with your production values!"
    exit 1
fi

# Generate NEXTAUTH_SECRET if not set
if ! grep -q "NEXTAUTH_SECRET=" .env.production.local || grep -q "NEXTAUTH_SECRET=your-secret" .env.production.local; then
    log_info "Generating NEXTAUTH_SECRET..."
    SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$SECRET/" .env.production.local
    else
        # Linux
        sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$SECRET/" .env.production.local
    fi
    log_success "NEXTAUTH_SECRET generated and saved"
fi

# Check required variables
log_info "Checking required environment variables..."

REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_CLIENT_EMAIL"
    "FIREBASE_PRIVATE_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env.production.local || grep -q "^${var}=\"\"$" .env.production.local; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    log_error "Missing required variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    log_warning "Please fill in all required variables in .env.production.local"
    exit 1
fi

log_success "All required variables are set"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

log_success "Docker is installed"

# Check if docker-compose is available
if ! docker compose version &> /dev/null && ! docker-compose version &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

log_success "Docker Compose is available"

# Create certs directory for SSL
if [ ! -d "certs" ]; then
    log_info "Creating certs directory for SSL certificates..."
    mkdir -p certs
    log_warning "You need to add SSL certificates to the certs/ directory:"
    log_warning "  - fullchain.pem"
    log_warning "  - privkey.pem"
    log_warning "Use Let's Encrypt: certbot certonly --standalone -d palkamtm.pl -d www.palkamtm.pl"
fi

log_success "Production setup check completed!"
log_info "Next steps:"
echo "  1. Edit .env.production.local with your production values"
echo "  2. Set up SSL certificates in certs/ directory"
echo "  3. Run: docker-compose -f docker-compose.prod.yml up -d"
echo "  4. Run migrations: docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy"

