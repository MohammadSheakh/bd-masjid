---
name: docker-cloudflare-tunnel
description: Production guide and reusable patterns for integrating Cloudflare Tunnel (cloudflared) with Docker Compose projects. Covers host vs bridge networking, Zero Trust Dashboard ingress rules, localhost origin resolution, handling multi-project connector conflicts, and security hardening.
license: MIT
metadata:
  version: "1.0.0"
---

# Docker Cloudflare Tunnel (`cloudflared`) Integration Guide

This skill provides an actionable, production-ready blueprint for configuring and operating **Cloudflare Tunnel (`cloudflared`)** inside Docker Compose projects. It ensures applications (Next.js, NestJS, Vite, Python, Go, etc.) are securely published to custom domains via Cloudflare Zero Trust without port forwarding, opening inbound firewall ports, or exposing public IPs.

---

## 🎯 When to Apply

Use this skill when:
- Exposing local or VPS Docker Compose applications to public hostnames (e.g., `https://masjid.sheakh.qzz.io`, `https://api.example.com`).
- Setting up `cloudflared` in a new or existing `docker-compose.yml`.
- Troubleshooting `502 Bad Gateway` errors from Cloudflare edge (`dial tcp [::1]:PORT: connect: connection refused`).
- Deciding between `network_mode: host` vs Docker bridge networking for origin routing.
- Resolving connector conflicts when multiple projects or containers run on the same VPS.

---

## 🛑 The Core Problem: Why `localhost` Fails in Docker Bridge Mode

When configuring Cloudflare Zero Trust Ingress, service destinations are often defined as:
```text
https://app.yourdomain.com  ➔  http://localhost:3005
```

### The Failure Mechanism:
1. `cloudflared` is written in Go. Go's standard DNS resolver treats `localhost` as a special hostname and hardcodes resolution to `127.0.0.1` and `::1`.
2. When `cloudflared` runs inside a standard Docker **bridge network** (`networks: [app-network]`), `localhost` resolves to the `cloudflared` container's **own isolated network namespace**.
3. No web server is listening on port 3005 inside the `cloudflared` container.
4. `cloudflared` logs:
   ```text
   ERR error="Unable to reach the origin service... dial tcp [::1]:3005: connect: connection refused" originService=http://localhost:3005
   ```
5. Visitors see **Cloudflare Error 502: Bad Gateway**.

---

## ⚡ The Two Proven Architecture Patterns

### Pattern A: Host Network Mode (`network_mode: host`) — Recommended for VPS / Multi-Project

Use this pattern when:
- Cloudflare Zero Trust routes to `http://localhost:<PORT>` (e.g. `http://localhost:3005`, `http://localhost:6733`).
- Host OS is Linux (Ubuntu, Debian, AlmaLinux, Arch, etc.).
- Multiple independent Docker Compose projects run on the same VPS and publish ports to `127.0.0.1`.

#### 1. `docker-compose.yml` Configuration:
```yaml
services:
  frontend:
    build: ./frontend
    container_name: my-app-frontend
    ports:
      # Bind exclusively to host loopback so only localhost and cloudflared can reach it
      - "127.0.0.1:3005:3000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/"]
      interval: 15s
      timeout: 5s
      retries: 3

  backend:
    build: ./backend
    container_name: my-app-backend
    ports:
      - "127.0.0.1:6733:6733"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:6733/api/v1/health"]
      interval: 15s
      timeout: 5s
      retries: 3

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: my-app-cloudflared
    restart: unless-stopped
    # Places cloudflared directly in host network namespace:
    network_mode: host
    command: tunnel --no-autoupdate --protocol http2 run --token ${CLOUDFLARE_TUNNEL_TOKEN:-}
    env_file:
      - path: .env
        required: false
    depends_on:
      frontend:
        condition: service_healthy
      backend:
        condition: service_healthy
    # ⚠️ NOTE: Do NOT add `networks:` when `network_mode: host` is set.
```

#### Why Pattern A Works:
- Inside `cloudflared`, `localhost:3005` connects directly to the host's `127.0.0.1:3005`.
- Docker port mappings forward `127.0.0.1:3005` to container `frontend:3000`.
- All applications mapped on the host loopback are instantly reachable.

---

### Pattern B: Bridge Network Mode (`networks: [app-network]`)

Use this pattern when:
- Cloudflare Zero Trust routes directly to internal container names (e.g., `http://frontend:3000`, `http://backend:6733`).
- Or developing on Docker Desktop for macOS/Windows (where `network_mode: host` does not share macOS/Windows host network).

#### 1. `docker-compose.yml` Configuration:
```yaml
services:
  frontend:
    build: ./frontend
    container_name: my-app-frontend
    networks:
      - app-network

  backend:
    build: ./backend
    container_name: my-app-backend
    networks:
      - app-network

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: my-app-cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate --protocol http2 run --token ${CLOUDFLARE_TUNNEL_TOKEN:-}
    env_file:
      - path: .env
        required: false
    depends_on:
      frontend:
        condition: service_healthy
      backend:
        condition: service_healthy
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

#### 2. Cloudflare Zero Trust Configuration for Pattern B:
In Cloudflare Zero Trust Dashboard:
- `app.yourdomain.com` ➔ `http://frontend:3000` *(Internal service name and port)*
- `api.yourdomain.com` ➔ `http://backend:6733`

---

## 🔒 Security Best Practices

1. **Bind Host Ports to `127.0.0.1`**:
   Never expose raw `0.0.0.0:PORT` to the public internet when using Cloudflare Tunnel.
   ```yaml
   # ✅ SECURE: Only local host & cloudflared can access
   ports:
     - "127.0.0.1:3005:3000"

   # ❌ INSECURE: Bypasses Cloudflare WAF, exposed to port scanners
   ports:
     - "3005:3000"
   ```

2. **Environment Variable Management**:
   Always store `CLOUDFLARE_TUNNEL_TOKEN` in `.env`, never commit it to git:
   ```env
   # .env
   CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi...
   ```
   Provide a placeholder in `.env.example`:
   ```env
   # .env.example
   CLOUDFLARE_TUNNEL_TOKEN=
   ```

3. **Use HTTP/2 Protocol (`--protocol http2`)**:
   In constrained network environments or corporate proxies where UDP/QUIC (HTTP/3) might be blocked or throttled, passing `--protocol http2` ensures instant, reliable tunnel registration:
   ```bash
   tunnel --no-autoupdate --protocol http2 run --token ${CLOUDFLARE_TUNNEL_TOKEN}
   ```

4. **Service Health Dependencies**:
   Prevent early traffic routing while the application is booting:
   ```yaml
   depends_on:
     frontend:
       condition: service_healthy
     backend:
       condition: service_healthy
   ```

---

## ⚠️ Gotchas & Troubleshooting

### 1. The "Ghost Connector" Conflict (Random 502 Errors)
- **Symptom**: Refreshing the browser returns `200 OK` once, then `502 Bad Gateway` on the next refresh.
- **Root Cause**: Cloudflare tunnels support High Availability (HA). If another container (e.g. an old project like `other-project-cloudflared-1`) is running on the host with the SAME tunnel token but cannot reach the new port, Cloudflare edge round-robins requests between connectors.
- **Fix**:
  ```bash
  # Check all running cloudflared containers
  docker ps --filter "ancestor=cloudflare/cloudflared:latest"

  # Stop obsolete or competing connectors
  docker stop <old-cloudflared-container-id>
  ```

### 2. Automatic Boot vs Profiles
- If `profiles: [tunnel]` is included in `docker-compose.yml`, running `docker compose up -d` will **skip** `cloudflared`.
- If the tunnel should start automatically with the rest of the application, **remove the `profiles:` block**.

### 3. Mixed Content & Browser `NetworkError` on API Calls
- **Symptom**: Frontend loaded over `https://app.yourdomain.com` throws `NetworkError when attempting to fetch resource` when making API requests.
- **Root Cause**: The client-side code was compiled with `NEXT_PUBLIC_API_URL=http://localhost:6733/api/v1` (insecure HTTP). Browsers block HTTP requests from HTTPS contexts under the **Mixed Content** security policy. Furthermore, visitors on other devices (phones, laptops) cannot resolve `localhost`.
- **Fix (The Two-Pronged Solution)**:
  1. **Next.js Reverse Proxy Rewrites**:
     In `next.config.ts`, rewrite `/api/v1/:path*` to the internal backend container (`http://backend:6733/api/v1/:path*`):
     ```typescript
     async rewrites() {
       const backend = process.env.INTERNAL_API_URL || 'http://backend:6733';
       return [
         {
           source: '/api/v1/:path*',
           destination: `${backend}/api/v1/:path*`,
         },
       ];
     }
     ```
     This allows client-side code on `https://app.yourdomain.com` to make relative requests to `/api/v1/...` with **zero CORS configuration and zero Mixed Content issues**.
  2. **Public HTTPS Backend URL & Flexible CORS**:
     If exposing the API directly (e.g. `https://api.yourdomain.com`), configure the backend CORS handler to dynamically accept comma-separated origins and subdomains (`*.yourdomain.com`).

---

## 🛠️ Step-by-Step Implementation Checklist

1. [ ] **Acquire Token**: Obtain the tunnel token from **Cloudflare Zero Trust ➔ Networks ➔ Tunnels**.
2. [ ] **Set `.env`**: Add `CLOUDFLARE_TUNNEL_TOKEN=<token>` to `.env`.
3. [ ] **Choose Mode**:
   - If Zero Trust uses `http://localhost:PORT`: Configure `network_mode: host` in `docker-compose.yml`.
   - If Zero Trust uses `http://<service-name>:PORT`: Configure bridge `networks: [app-network]`.
4. [ ] **Protect Ports**: Ensure host port bindings specify `127.0.0.1:<PORT>:<CONTAINER_PORT>`.
5. [ ] **Stop Conflicting Connectors**: Run `docker ps` to verify no orphaned `cloudflared` instances exist.
6. [ ] **Start Compose**:
   ```bash
   docker compose up -d
   ```
7. [ ] **Verify Tunnel Registration**:
   ```bash
   docker logs --tail 30 <container_name>-cloudflared
   ```
   Look for: `INF Registered tunnel connection ... protocol=http2`.
8. [ ] **Verify Public Domain**:
   ```bash
   curl -sI https://yourdomain.com/
   ```
   Ensure it returns `HTTP/2 200` with header `server: cloudflare`.
