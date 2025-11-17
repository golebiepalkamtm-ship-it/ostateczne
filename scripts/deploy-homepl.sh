#!/bin/bash

# Deployment script for Home.pl hosting
# This script prepares the project for deployment

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

log_info "🚀 Home.pl Deployment Preparation"
echo ""

log_warning "⚠️  Home.pl shared hosting has limitations for Next.js"
log_warning "⚠️  Recommended: Deploy to Vercel and point domain to Vercel"
echo ""

read -p "Do you want to deploy to Vercel? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_info "Installing Vercel CLI..."
        npm i -g vercel
    fi
    
    # Check if logged in
    if ! vercel whoami &> /dev/null; then
        log_info "Please login to Vercel..."
        vercel login
    fi
    
    # Deploy
    log_info "Deploying to production..."
    vercel --prod
    
    log_success "Deployment completed!"
    log_info "Next steps:"
    echo "  1. Go to Vercel Dashboard → Settings → Domains"
    echo "  2. Add domain: palkamtm.pl"
    echo "  3. Configure DNS in Home.pl panel:"
    echo "     - Type: A, Name: @, Value: [IP from Vercel]"
    echo "     - Type: CNAME, Name: www, Value: [CNAME from Vercel]"
    echo "  4. Add environment variables in Vercel Dashboard"
    
else
    log_warning "Static export option (limited functionality)"
    log_warning "API routes and server-side features will NOT work"
    echo ""
    read -p "Continue with static export? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Preparing static export..."
        
        # Check if output: 'export' is in next.config.cjs
        if ! grep -q "output: 'export'" next.config.cjs; then
            log_warning "You need to add 'output: export' to next.config.cjs"
            log_warning "This will disable API routes and SSR"
            exit 1
        fi
        
        # Build
        log_info "Building application..."
        npm run build
        
        log_success "Build completed!"
        log_info "Next steps:"
        echo "  1. Connect to FTP: serwer2562803.home.pl"
        echo "  2. Upload contents of 'out/' folder to 'public_html/'"
        echo "  3. Configure DNS and SSL in Home.pl panel"
        
    else
        log_info "Deployment cancelled"
        exit 0
    fi
fi

