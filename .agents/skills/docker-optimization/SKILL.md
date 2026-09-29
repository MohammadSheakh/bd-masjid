---
name: docker-optimization
description: Complete guide and production patterns for Docker optimization. Covers minimal base images (Alpine, Slim, Distroless, Scratch), layer caching strategy, .dockerignore best practices, multi-stage builds, separating build-time tools from runtime artifacts, security hardening, and reducing image sizes and CI/CD build times.
license: MIT
metadata:
  version: "1.0.0"
---

# Docker Optimization & Production Best Practices

This skill provides an actionable, end-to-end reference for optimizing Docker images and build workflows. It covers reducing image sizes from gigabytes to megabytes, accelerating CI/CD build pipelines through layer caching, utilizing multi-stage builds, and hardening container security.

---

## 🎯 When to Apply

Use this skill when:
- Creating a new `Dockerfile` for any application (Node.js, TypeScript, Next.js, Python, Go, Rust, etc.).
- Refactoring bloated or slow-building existing Dockerfiles.
- Optimizing CI/CD pipelines where container builds exceed acceptable time limits.
- Auditing container images for security vulnerabilities, unnecessary packages, or leaked secrets.
- Structuring `.dockerignore` files to reduce build context upload times.

---

## 🛑 Common Anti-Patterns ("The Very Bad Dockerfile")

Avoid monolithic single-stage Dockerfiles that install system tools and copy all code upfront:

```dockerfile
# ❌ ANTI-PATTERN: Heavy base, poor caching, build bloat in runtime
FROM ubuntu:latest

RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
RUN apt-get install -y nodejs

WORKDIR /app

# Invalidation trigger: Changing 1 line of code invalidates npm install!
COPY . .

RUN npm install
RUN npm run build

# Runs as root, contains TypeScript compiler, source files, and devDependencies
CMD ["npm", "start"]
```

### Why this fails in production:
1. **Massive Image Bloat**: Full OS base images add hundreds of megabytes of unused utilities (package managers, editors, shell utilities).
2. **Broken Layer Caching**: `COPY . .` placed before dependency installation means every minor code edit forces a full `npm install` from scratch.
3. **Leaked Build Tools & Attack Surface**: Compilers, TypeScript source files, build scripts, and devDependencies remain in the runtime image.
4. **Security Vulnerabilities**: Running as `root` without unprivileged user switching.

---

## ⚡ The 5 Core Optimization Strategies

### 1. Choose the Smallest Appropriate Base Image

| Base Image Type | Example | Typical Size | Ideal Use Case | Trade-offs & Gotchas |
| :--- | :--- | :--- | :--- | :--- |
| **Full OS** | `ubuntu:24.04`, `debian:bookworm` | ~150MB+ base | Complex legacy system dependencies | Massive image size, hundreds of unnecessary packages, high CVE exposure |
| **Debian Slim** | `node:22-bookworm-slim` | ~50-80MB base | **Recommended for NestJS, Prisma, native addons** | Uses standard `glibc`; slightly larger than Alpine but zero compilation or memory fragmentation issues |
| **Alpine** | `node:22-alpine`, `alpine:3.20` | ~5-10MB base (Node ~45MB) | Lightweight microservices with zero native C++ bindings | Uses `musl` libc instead of `glibc`; can break Prisma/sharp or suffer memory fragmentation under load |
| **Distroless** | `gcr.io/distroless/nodejs22-debian12` | Minimal runtime only | High-security production containers | No shell or package manager for runtime debugging |
| **Scratch** | `scratch` | 0 MB (empty) | Statically compiled binaries (Go, Rust) | Must be completely self-contained statically linked binary |

> **⚠️ The "Alpine Trap" (musl vs glibc)**:
> Many tutorials blindly recommend Alpine for Node.js because the base image is ~45MB. However:
> 1. Packages with native bindings (`@prisma/client`, `sharp`, `bcrypt`, `canvas`) rely on `glibc`. On Alpine, they either require `libc6-compat` (which can still have ABI edge cases) or force recompilation from source via `python3`, `make`, and `g++`, multiplying build times.
> 2. `musl`'s memory allocator is slower and susceptible to memory fragmentation under high concurrent I/O.
> 3. **Rule of Thumb**: Use **`node:22-bookworm-slim`** for enterprise Node/NestJS + Prisma applications. Reserve **`node:22-alpine`** for pure JavaScript/TypeScript microservices without native dependencies. For Go/Rust static binaries, build on **`scratch`**.

---

### 2. Master Docker Layer Caching

Docker executes Dockerfile instructions from top to bottom, caching each intermediate layer.
- **The Invalidation Rule**: When a layer changes, **all subsequent (downstream) layers are invalidated and must re-run**.
- **The Caching Strategy**: Place infrequently changing steps near the top; place frequently changing source code near the bottom.

#### Example: Optimizing Node.js / TypeScript Dependency Caching
```dockerfile
# 1. Base setup (rarely changes)
FROM node:22-bookworm-slim
WORKDIR /app

# 2. Copy ONLY lockfiles first (changes only when packages are added/upgraded)
COPY package.json package-lock.json ./

# 3. Install dependencies using BuildKit Cache Mount (see below)
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# 4. Copy source code (changes frequently on every commit)
COPY . .

# 5. Build application
RUN npm run build
```

#### 🚀 BuildKit Cache Mounts (`--mount=type=cache`)
Linear layer caching fails when `package.json` changes: even adding a minor dev tool invalidates the layer and forces re-downloading every single package from the internet.

BuildKit cache mounts mount persistent directories on the host builder that **survive across layer invalidations**:

- **NPM cache mount**:
  ```dockerfile
  RUN --mount=type=cache,target=/root/.npm \
      npm ci
  ```
- **PNPM store cache mount**:
  ```dockerfile
  ENV PNPM_HOME="/pnpm"
  ENV PATH="$PNPM_HOME:$PATH"
  RUN corepack enable
  RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
      pnpm install --frozen-lockfile
  ```
- **Debian APT cache mount**:
  ```dockerfile
  RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
      --mount=type=cache,target=/var/lib/apt,sharing=locked \
      apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates
  ```

#### 🔒 Build Secrets Without Layer Leaks (`--mount=type=secret`)
Never pass API tokens or private npm tokens via `ARG` or `ENV`—they are baked permanently into Docker image layers and metadata (`docker history`).

Use BuildKit secret mounts, which expose the secret into a temporary in-memory filesystem during the `RUN` step and never commit it into any layer:

```dockerfile
# CI/CD: docker build --secret id=npmrc,src=.npmrc .
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```

---

### 3. Exclude Unnecessary Files with `.dockerignore`

Before Docker builds an image, the Docker CLI sends the entire **build context** (all files in the directory) to the Docker daemon. Unfiltered contexts waste network transfer time and risk baking sensitive files into the image.

Always create a `.dockerignore` file in the same directory as the `Dockerfile`:

```text
# Dependencies (installed fresh inside container)
node_modules/
npm-debug.log*
yarn-error.log*
pnpm-debug.log*

# Build outputs & caches
dist/
build/
.next/
.turbo/
coverage/

# Version control & local environment
.git/
.gitignore
.env
.env.*
!.env.example

# IDE & OS metadata
.idea/
.vscode/
*.swp
*.swo
.DS_Store
Thumbs.db

# Documentation & temporary scratchpads
*.md
!README.md
docs/
```

---

### 4. Separate Build Tools from Runtime (Multi-Stage Builds)

Never leave compilers, devDependencies, or raw source code in your production container. Multi-stage builds define multiple `FROM` instructions, allowing you to selectively copy only compiled production artifacts from the builder to the runner.

#### Pattern A: NestJS / Backend Multi-Stage (Debian-Slim, Safe for Prisma & Native Addons)
```dockerfile
# -------------------------------------------------------------
# Stage 1: Dependencies Cache
# -------------------------------------------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# BuildKit cache mount speeds up repeated CI builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# -------------------------------------------------------------
# Stage 2: Application Builder & Prisma Generation
# -------------------------------------------------------------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & compile TypeScript to /dist
RUN npx prisma generate || true
RUN npm run build

# Prune devDependencies to keep only production packages
RUN npm prune --omit=dev

# -------------------------------------------------------------
# Stage 3: Minimal Production Runner
# -------------------------------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Security: Install dumb-init for PID 1 signal forwarding & create non-root user
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init openssl && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 -g nodejs appuser

# Copy ONLY compiled dist, pruned node_modules, and package config
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

USER appuser

EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

> **⚠️ Alpine Warning**: If adapting this for Alpine (`node:22-alpine`), remember that `libc6-compat` and `dumb-init` **must be installed in the final `runner` stage** as well as `deps`, otherwise native libraries (Prisma query engine, bcrypt, sharp) will crash at container boot with `Error loading shared library ld-linux-x86-64.so.2`.

---

#### Pattern B: Next.js Frontend Multi-Stage (`output: 'standalone'`)
Modern Next.js applications should **never** copy raw `node_modules` into production. Configure `next.config.js` with `output: 'standalone'`, which automatically bundles only the exact traced code and dependencies into `.next/standalone`:

```dockerfile
# -------------------------------------------------------------
# Stage 1: Dependencies
# -------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# -------------------------------------------------------------
# Stage 2: Next.js Builder
# -------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js telemetry disable during build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# -------------------------------------------------------------
# Stage 3: Ultra-Minimal Next.js Runner (~70MB image)
# -------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Automatically copies only traced dependencies and server bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

---

#### Pattern C: Compiled Language (Rust / Go) with `scratch`:
```dockerfile
# Stage 1: Full Compiler Toolchain
FROM rust:1.80-alpine AS builder
WORKDIR /build

COPY Cargo.toml Cargo.lock ./
COPY src ./src

# Compile statically linked binary
RUN cargo build --release --target x86_64-unknown-linux-musl

# Stage 2: Completely Empty Scratch Image (~15MB final size)
FROM scratch
WORKDIR /app

COPY --from=builder /build/target/x86_64-unknown-linux-musl/release/my-app /app/server

EXPOSE 8080
CMD ["/app/server"]
```

---

### 5. Production Hardening, Vulnerability Scanning & SBOM

1. **Never Run as `root`**:
   - Attackers who break out of an unprivileged container have standard user rights on the host, whereas `root` in a container can escalate privileges on the host kernel.
   - Always create and switch to a non-root user (`USER appuser`).
2. **Proper Signal Handling (`PID 1`)**:
   - Node.js does not reap zombie child processes and does not handle kernel signals (like `SIGTERM` on `docker stop` or Kubernetes pod eviction) properly when running as PID 1.
   - Always wrap execution with `dumb-init` or `tini` as the container `ENTRYPOINT`.
3. **Zero-Dependency Native Healthchecks (`node -e fetch`)**:
   - Avoid bloating minimal production images with `curl` or `wget`. Leverage Node's built-in global `fetch` API:
     ```dockerfile
     HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
       CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
     ```
4. **Vulnerability Scanning in CI/CD (Trivy & Docker Scout)**:
   - Run automated container audits before pushing to image registries:
     ```bash
     # Scan for High and Critical vulnerabilities using Trivy
     trivy image --severity HIGH,CRITICAL --exit-code 1 my-app:latest

     # Quick CVE inspection using Docker Scout
     docker scout quickview my-app:latest
     docker scout cves --only-severity critical,high my-app:latest
     ```
5. **Software Bill of Materials (SBOM) & Attestations**:
   - Modern BuildKit can automatically attach provenance attestations and SBOM metadata:
     ```bash
     docker buildx build --sbom=true --provenance=mode=max -t my-app:latest .
     ```

---

### 6. Secure Ingress: Cloudflare Tunnel & Private Host Binding

When exposing containerized applications to the internet, exposing public ports (`0.0.0.0:80`, `0.0.0.0:443`, `0.0.0.0:3000`) directly on the host machine opens attack vectors (port scans, direct-to-IP DDoS, bypassed WAF).

A production-grade pattern combines **Cloudflare Zero Trust Tunnels (`cloudflared`)** with **Private Host IP Binding (`127.0.0.1`)**:

#### 1. Bind Container Ports to Localhost Only
Never bind services directly to `0.0.0.0` when using an edge tunnel. Restrict host exposure to loopback:
```yaml
ports:
  # ✅ SECURE: Accessible only locally; outside world must route through Cloudflare Tunnel
  - "${BACKEND_BIND_IP:-127.0.0.1}:${BACKEND_PORT:-6733}:6733"
  - "${FRONTEND_BIND_IP:-127.0.0.1}:${FRONTEND_PORT:-3000}:3000"
```

#### 2. Orchestrating `cloudflared` in Docker Compose
Run the official Cloudflare Tunnel container alongside your application inside the shared Docker network:
```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: app-cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate --protocol http2 run --token ${CLOUDFLARE_TUNNEL_TOKEN:-}
    env_file:
      - .env
    depends_on:
      frontend:
        condition: service_healthy
      backend:
        condition: service_healthy
    networks:
      - app-network
```

#### 3. Cloudflare Dashboard Route Mapping
Inside the Cloudflare Zero Trust Dashboard, point Public Hostnames to internal Docker service DNS names:
- `api.yourdomain.com` ➔ `http://backend:6733`
- `app.yourdomain.com` ➔ `http://frontend:3000`

Benefits:
- **No inbound router/firewall ports open**: All traffic is established via outbound TLS tunnels to Cloudflare edge.
- **Automated SSL/TLS**: Cloudflare terminates HTTPS and auto-renews certificates.
- **DDoS & WAF Protection**: Requests are scrubbed before reaching your container host.

---

## 📊 Summary Checklist: Production Docker Review

Before committing any `Dockerfile` or `docker-compose.yml`:

- [ ] **Base Image**: Uses official Alpine, Debian Slim (`bookworm-slim`), or Scratch. Chose Slim for apps with native C++/Prisma dependencies.
- [ ] **BuildKit Cache Mounts**: Package installs use `--mount=type=cache,target=/root/.npm` (or pnpm store) to survive lockfile changes.
- [ ] **Secret Injection**: Private npm or git credentials mounted with `--mount=type=secret` instead of `ARG`/`ENV`.
- [ ] **Layer Order**: Infrequent dependencies copied and installed *before* application source code.
- [ ] **.dockerignore**: Excludes `node_modules`, `dist`, `.git`, `.env*`, and logs from build context.
- [ ] **Multi-Stage**: Build tools (`tsc`, compilers, test suites) are discarded before the final runner image.
- [ ] **Next.js Standalone**: Configured `output: 'standalone'` in `next.config.js` and copied `.next/standalone` without raw `node_modules`.
- [ ] **Alpine Native Library Compatibility**: If using Alpine, verified `libc6-compat` is installed in the *runner* stage for Prisma/sharp.
- [ ] **Dependencies Pruned**: Production runner only contains runtime dependencies (`npm prune --omit=dev` or standalone bundle).
- [ ] **Security**: Runs under an unprivileged user (`USER ...`), not as `root`.
- [ ] **Signal Forwarding**: Uses `dumb-init` or `tini` as `ENTRYPOINT` to ensure graceful termination on `SIGTERM`.
- [ ] **Health Check**: Defines an explicit zero-dependency `HEALTHCHECK` (e.g. native `node -e fetch(...)`).
- [ ] **Vulnerability Audit**: Scanned with `trivy` or `docker scout` for High/Critical CVEs before registry push.
- [ ] **Host Port Exposure**: Binds to `127.0.0.1` rather than `0.0.0.0` when running behind Cloudflare Tunnel or reverse proxy.
- [ ] **Zero Trust Ingress**: Utilizes `cloudflare/cloudflared` for secure edge routing without public open ports.
