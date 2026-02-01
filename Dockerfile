# Railway Operations Management System - Production Docker Build
# Multi-stage build for optimized image size and security

# Stage 1: Build Stage
FROM node:22-bookworm-slim AS builder

# Install build dependencies for native modules (canvas, bcrypt)
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  build-essential \
  pkg-config \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy application source
COPY . .

# Build frontend and backend
RUN npm run build

# Stage 2: Production Stage
FROM node:22-bookworm-slim

# Install runtime dependencies for native modules
RUN apt-get update && apt-get install -y \
  libcairo2 \
  libpango-1.0-0 \
  libjpeg62-turbo \
  libgif7 \
  librsvg2-2 \
  && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV NODE_ENV=production

# Create app directory and set ownership
RUN mkdir -p /app && chown -R node:node /app

WORKDIR /app

# Switch to non-root user for security
USER node

# Copy production dependencies from builder
COPY --chown=node:node --from=builder /build/node_modules ./node_modules

# Copy built application
COPY --chown=node:node --from=builder /build/dist ./dist
COPY --chown=node:node --from=builder /build/package*.json ./
COPY --chown=node:node --from=builder /build/db ./db
COPY --chown=node:node --from=builder /build/server ./server


# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
CMD ["npm", "start"]
