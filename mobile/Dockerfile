# syntax=docker/dockerfile:1.7

# ==============================================================================
# Stage 1: Base - Setup Node environment & install dependencies
# ==============================================================================
FROM node:22-bookworm-slim AS base

WORKDIR /app

ENV NODE_ENV=development
ENV CI=1

# Copy only package manifests to leverage layer cache
COPY package.json package-lock.json ./

# Install dependencies with npm cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

# ==============================================================================
# Stage 2: Development / Metro Bundler Target (Port 8081)
# ==============================================================================
FROM base AS dev

WORKDIR /app

COPY . .

EXPOSE 8081

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

CMD ["npx", "expo", "start", "--host", "0.0.0.0", "--port", "8081"]

# ==============================================================================
# Stage 3: Builder - Compile static web distribution bundle
# ==============================================================================
FROM base AS builder

WORKDIR /app

COPY . .

ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL:-http://localhost:6733/api/v1}

RUN npx expo export -p web --output-dir dist

# ==============================================================================
# Stage 4: Production - Hardened Nginx Alpine static web server (Port 80)
# ==============================================================================
FROM nginx:1.27-alpine AS production

# Security: Remove default nginx configuration and html files
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy custom hardened nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Healthcheck to probe server readiness
HEALTHCHECK --interval=15s --timeout=3s --retries=3 --start-period=5s \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
