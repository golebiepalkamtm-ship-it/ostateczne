@echo off
set PRISMA_CLIENT_ENGINE_TYPE=binary
set DATABASE_URL=postgresql://auctions_user:secure_password_123@localhost:5433/auctions?connect_timeout=5^&pool_timeout=30^&statement_timeout=60000
echo Starting Prisma seed with binary engine...
npx tsx prisma/seed-simple.ts
pause
