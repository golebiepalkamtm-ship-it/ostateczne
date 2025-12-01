# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files AND Prisma schema before install
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install ALL dependencies (including devDependencies for build)
# This will also run prisma generate via postinstall hook
RUN npm install --legacy-peer-deps

# Copy rest of the application
COPY . .

# Build Next.js without running migrations (migrations will run at container start)
RUN npx next build

# Production image
FROM node:20-alpine
WORKDIR /app

# Copy package files and install ONLY production dependencies
# Skip postinstall script (prisma generate) since we'll copy generated client
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts --legacy-peer-deps

# Copy Prisma Client and schema from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.* ./

# Copy only static assets from public/ (exclude large user-generated files)
# User uploads will be mounted as volumes in docker-compose
COPY --from=builder /app/public/*.* ./public/
COPY --from=builder /app/public/sw.js* ./public/
COPY --from=builder /app/public/workbox-*.js* ./public/

# Copy entrypoint script (run migrations at startup)
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]
