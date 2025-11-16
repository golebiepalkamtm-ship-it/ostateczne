#!/bin/bash

# ============================================================================
# FAZA 11: AUTOMATION SCRIPT - Pałka MTM Production Deployment
# Filepath: scripts/start-prod-local.sh
# ============================================================================
# Purpose: Automate local production deployment with Docker Compose
# Usage: bash scripts/start-prod-local.sh
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# CONFIGURATION
# ============================================================================

PROJECT_NAME="palka-mtm"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production.local"
ENV_TEMPLATE=".env.docker"
FIREBASE_SECRETS_FILE="secrets/firebase-admin.json"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║  PAŁKA MTM - PRODUCTION DEPLOYMENT AUTOMATION         ║"
echo "║  Faza 11: Docker Compose Setup & Launch              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# STEP 1: VERIFY REQUIRED FILES
# ============================================================================

echo -e "${YELLOW}[STEP 1] Verifying required files...${NC}"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo -e "${RED}❌ Error: $COMPOSE_FILE not found${NC}"
  exit 1
fi
echo -e "${GREEN}✓ docker-compose.prod.yml found${NC}"

if [ ! -f "Dockerfile" ]; then
  echo -e "${RED}❌ Error: Dockerfile not found${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Dockerfile found${NC}"

if [ ! -f "$ENV_TEMPLATE" ]; then
  echo -e "${RED}❌ Error: $ENV_TEMPLATE not found${NC}"
  exit 1
fi
echo -e "${GREEN}✓ .env.docker template found${NC}"

# ============================================================================
# STEP 2: SETUP ENVIRONMENT FILE
# ============================================================================

echo -e "${YELLOW}[STEP 2] Setting up environment...${NC}"

if [ -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}⚠ $ENV_FILE already exists. Keeping existing configuration.${NC}"
else
  echo -e "${YELLOW}Creating $ENV_FILE from template...${NC}"
  cp "$ENV_TEMPLATE" "$ENV_FILE"
  echo -e "${GREEN}✓ Environment file created${NC}"
fi

# ============================================================================
# STEP 3: HANDLE FIREBASE ADMIN CREDENTIALS
# ============================================================================

echo -e "${YELLOW}[STEP 3] Processing Firebase Admin credentials...${NC}"

if [ -f "$FIREBASE_SECRETS_FILE" ]; then
  echo -e "${YELLOW}Found Firebase admin secrets file${NC}"
  
  # Read the JSON file and encode to Base64
  FIREBASE_ADMIN_BASE64=$(cat "$FIREBASE_SECRETS_FILE" | base64 -w 0)
  
  # Add to environment file if not already present
  if grep -q "FIREBASE_ADMIN_CREDENTIALS_BASE64" "$ENV_FILE"; then
    echo -e "${YELLOW}⚠ FIREBASE_ADMIN_CREDENTIALS_BASE64 already in env file${NC}"
  else
    echo "" >> "$ENV_FILE"
    echo "# Firebase Admin SDK Credentials (Base64 encoded)" >> "$ENV_FILE"
    echo "FIREBASE_ADMIN_CREDENTIALS_BASE64=$FIREBASE_ADMIN_BASE64" >> "$ENV_FILE"
    echo -e "${GREEN}✓ Firebase credentials added to env file${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Warning: $FIREBASE_SECRETS_FILE not found${NC}"
  echo -e "${YELLOW}  Please add Firebase credentials manually to $ENV_FILE${NC}"
fi

# ============================================================================
# STEP 4: VERIFY REQUIRED ENV VARIABLES
# ============================================================================

echo -e "${YELLOW}[STEP 4] Verifying required environment variables...${NC}"

REQUIRED_VARS=(
  "DATABASE_URL"
  "REDIS_URL"
  "FIREBASE_ADMIN_CREDENTIALS_BASE64"
  "SENTRY_DSN"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^$var=" "$ENV_FILE"; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo -e "${YELLOW}⚠ Warning: Missing environment variables:${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo -e "${YELLOW}  - $var${NC}"
  done
  echo -e "${YELLOW}Please add them to $ENV_FILE before running services${NC}"
else
  echo -e "${GREEN}✓ All required environment variables present${NC}"
fi

# ============================================================================
# STEP 5: CLEAN UP DOCKER RESOURCES (OPTIONAL)
# ============================================================================

echo -e "${YELLOW}[STEP 5] Preparing Docker environment...${NC}"

# Check if containers already running
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
  echo -e "${YELLOW}⚠ Some containers are already running${NC}"
  read -p "Stop and rebuild? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Stopping existing services...${NC}"
    docker-compose -f "$COMPOSE_FILE" down -v
    echo -e "${GREEN}✓ Stopped${NC}"
  fi
fi

# ============================================================================
# STEP 6: BUILD DOCKER IMAGE
# ============================================================================

echo -e "${YELLOW}[STEP 6] Building Docker image with BuildKit...${NC}"

export DOCKER_BUILDKIT=1

if docker build \
  -f Dockerfile \
  -t "$PROJECT_NAME:latest" \
  -t "$PROJECT_NAME:1.0.0" \
  --progress=plain \
  .; then
  echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
  echo -e "${RED}❌ Docker build failed${NC}"
  exit 1
fi

# ============================================================================
# STEP 7: START DOCKER COMPOSE STACK
# ============================================================================

echo -e "${YELLOW}[STEP 7] Starting Docker Compose stack...${NC}"

if docker-compose -f "$COMPOSE_FILE" up -d; then
  echo -e "${GREEN}✓ Docker Compose stack started${NC}"
else
  echo -e "${RED}❌ Failed to start Docker Compose stack${NC}"
  exit 1
fi

# ============================================================================
# STEP 8: VERIFY SERVICES
# ============================================================================

echo -e "${YELLOW}[STEP 8] Verifying services...${NC}"

sleep 5

echo -e "${BLUE}Service Status:${NC}"
docker-compose -f "$COMPOSE_FILE" ps

# ============================================================================
# STEP 9: DISPLAY ACCESS INFORMATION
# ============================================================================

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║  DEPLOYMENT SUCCESSFUL!                               ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  📍 Access Points:                                     ║"
echo "║                                                        ║"
echo "║  🌐 Application:                                       ║"
echo "║     http://localhost:3000                              ║"
echo "║                                                        ║"
echo "║  📊 Prometheus Monitoring:                             ║"
echo "║     http://localhost:9090                              ║"
echo "║                                                        ║"
echo "║  📈 Grafana Dashboards:                                ║"
echo "║     http://localhost:3001                              ║"
echo "║     Username: admin                                    ║"
echo "║     Password: admin                                    ║"
echo "║                                                        ║"
echo "║  💾 Redis Cache:                                       ║"
echo "║     localhost:6379                                     ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  📋 Useful Commands:                                   ║"
echo "║                                                        ║"
echo "║  View logs:                                            ║"
echo "║  $ docker-compose -f docker-compose.prod.yml logs -f   ║"
echo "║                                                        ║"
echo "║  Stop services:                                        ║"
echo "║  $ docker-compose -f docker-compose.prod.yml down      ║"
echo "║                                                        ║"
echo "║  Restart services:                                     ║"
echo "║  $ docker-compose -f docker-compose.prod.yml restart   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# STEP 10: INITIAL HEALTH CHECK
# ============================================================================

echo -e "${YELLOW}[STEP 10] Running health checks...${NC}"

RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is responding${NC}"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}⚠ Application not responding yet. Check logs.${NC}"
    echo -e "${YELLOW}  docker-compose -f docker-compose.prod.yml logs app${NC}"
    exit 1
  fi
  
  sleep 2
  echo -e "${YELLOW}Waiting for application... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
done

echo -e "${GREEN}✓ All health checks passed${NC}"

echo -e "${GREEN}"
echo "════════════════════════════════════════════════════════"
echo "  PAŁKA MTM is now running in production mode!"
echo "════════════════════════════════════════════════════════"
echo -e "${NC}"

exit 0

