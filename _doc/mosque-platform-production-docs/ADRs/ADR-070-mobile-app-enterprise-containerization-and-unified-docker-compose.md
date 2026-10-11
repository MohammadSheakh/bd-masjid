# ADR-070: Mobile App Enterprise Containerization & Unified Docker Compose Orchestration

## Status
Accepted

## Date
2026-10-10

## Context
The BD Masjid platform previously containerized Redis, NestJS backend (`backend`), Next.js customer web frontend (`frontend`), and Cloudflare Tunnel (`cloudflared`) in `docker-compose.yml`. However, the Expo/React Native mobile application (`mobile/`) lacked production containerization. Developers and operators could not spin up the complete end-to-end platform (database, cache, API backend, web frontend, and mobile application) with a single `docker compose up` command.

The mobile containerization must satisfy:
1. **Low Memory & Lightweight Base Image**: Strictly conform to `.agents/skills/docker-optimization/SKILL.md` (Debian slim for builder, minimal Nginx Alpine for runtime static distribution).
2. **Dual-Target Multi-Stage Architecture**:
   - `production`: Static web preview / PWA bundle served via hardened Nginx on port 8082 with gzip, non-root user, and healthcheck.
   - `dev`: Live Expo Metro bundler on port 8081 for scanning QR codes and testing in Expo Go on Android/iOS devices.
3. **Unified Single-Command Orchestration**: Integrated directly into root `docker-compose.yml` on `bd-masjid-network`, depending on healthy `backend` service.

## Decision
We implement enterprise containerization for the mobile application adhering to:

1. **Multi-Stage Dockerfile (`mobile/Dockerfile`)**:
   - Stage 1 (`base`): `node:22-bookworm-slim` with lockfile copying and cached `npm ci`.
   - Stage 2 (`dev`): Exposed port 8081 running `npx expo start --host 0.0.0.0 --port 8081`.
   - Stage 3 (`builder`): Compiles web export bundle with `EXPO_PUBLIC_API_URL` build arg.
   - Stage 4 (`production`): `nginx:alpine` serving `/usr/share/nginx/html`, security headers, custom `nginx.conf`, non-root execution.
2. **Optimized Build Context (`mobile/.dockerignore`)**:
   - Excludes `.git`, `node_modules`, `.expo`, `npm-debug.log`, `.env.local`, and build artifacts to maintain fast context transfers (<5MB).
3. **Nginx Hardened Configuration (`mobile/nginx.conf`)**:
   - Gzip compression for JS/CSS/JSON/SVG.
   - SPA fallback (`try_files $uri $uri/ /index.html`).
   - Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
4. **Unified Docker Compose Integration (`docker-compose.yml`)**:
   - Service name: `mobile`
   - Ports: `8082:80` (Web preview/distribution) and `8081:8081` (Metro bundler).
   - Network: `bd-masjid-network`.
   - Depends on: `backend` with `condition: service_healthy`.
   - Healthcheck: Probes `http://127.0.0.1:80/` with retry interval.

## Consequences
- **Positive**: Single-command startup (`docker compose up`) boots Redis, NestJS, Next.js, and Expo Mobile simultaneously.
- **Positive**: Production image size is minimal (<35MB Nginx Alpine layer) with multi-stage separation.
- **Positive**: Zero bloat in runtime container (Node, npm, and devDependencies stripped from final distribution image).
