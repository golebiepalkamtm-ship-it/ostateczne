# Build stage
FROM node:20-bullseye-slim AS builder
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
FROM node:20-bullseye-slim
WORKDIR /app

# Copy package files and install ONLY production dependencies
# Skip postinstall script (prisma generate) since we'll copy generated client
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts --legacy-peer-deps

# Provide runtime stub for optional OpenTelemetry package if not present
# (prevents MODULE_NOT_FOUND for @opentelemetry/instrumentation-http)
COPY lib/stubs/opentelemetry-instrumentation-http.js ./node_modules/@opentelemetry/instrumentation-http/index.js

# Ensure system OpenSSL libraries needed by Prisma native engines are available
RUN apt-get update \
  && apt-get install -y --no-install-recommends libssl1.1 ca-certificates \
  && rm -rf /var/lib/apt/lists/*

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
# Copy startup diagnostic script so entrypoint can run it in runtime image
COPY --from=builder /app/scripts/startup-diagnostic.js ./scripts/startup-diagnostic.js
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Some Next standalone bundles expect files under /workspace.
# Create /workspace and symlink key folders so module resolution works
RUN mkdir -p /workspace \
  && ln -s /app/.next /workspace/.next || true \
  && ln -s /app/node_modules /workspace/node_modules || true \
  && ln -s /app/public /workspace/public || true \
  && ln -s /app/prisma /workspace/prisma || true \
  && ln -s /app/scripts /workspace/scripts || true

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]
