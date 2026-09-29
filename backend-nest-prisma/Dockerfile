# -------------------------------------------------------------
# Stage 1: Dependencies
# -------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# -------------------------------------------------------------
# Stage 2: Builder
# -------------------------------------------------------------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate modular schema and Prisma client
RUN node prisma/scripts/build-prisma-schemaV2.js && pnpm prisma generate --schema prisma/schema.prisma

# Compile NestJS core and all workspace libraries
RUN pnpm run build

# -------------------------------------------------------------
# Stage 3: Production Runner
# -------------------------------------------------------------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl ca-certificates dumb-init wget
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=6733

# Create unprivileged system user for secure container execution
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy runtime assets and compiled output
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/prisma.config.ts ./
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

USER nestjs

EXPOSE 6733

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=4 \
  CMD wget -qO- http://localhost:6733/api/v1/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--", "./docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
