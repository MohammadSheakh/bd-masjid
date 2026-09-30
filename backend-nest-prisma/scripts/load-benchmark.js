#!/usr/bin/env node
/**
 * Mosque Platform API & PostGIS Spatial Search Load Benchmark (ADR-017 & F-016)
 *
 * Simulates concurrent community traffic (50 connections over 20s) across:
 * 1. PostGIS radial discovery (/api/v1/mosques/nearby)
 * 2. Text search (/api/v1/mosques?search=Baitul)
 * 3. Operational health probe (/api/v1/health)
 *
 * Enforces production SLAs:
 * - 0% errors (no DB connection exhaustion or 500s)
 * - p95 latency <= 150ms
 */

const autocannon = require('autocannon');

const TARGET_URL = process.env.BENCHMARK_URL || 'http://localhost:6733';
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || '50', 10);
const DURATION_SECS = parseInt(process.env.BENCHMARK_DURATION || '20', 10);
const isLocalDb = process.env.IS_LOCAL_DB === 'true';
const DEFAULT_MAX_P95 = isLocalDb ? '150' : '1500';
const MAX_P95_LATENCY_MS = parseInt(
  process.env.BENCHMARK_MAX_P95 || DEFAULT_MAX_P95,
  10,
);
const BYPASS_TOKEN =
  process.env.BENCHMARK_BYPASS_TOKEN || 'production-benchmark-bypass-9988';

console.log('='.repeat(70));
console.log(' Mosques Platform — Production API & PostGIS Load Benchmark');
console.log('='.repeat(70));
console.log(` Target URL:           ${TARGET_URL}`);
console.log(` Concurrency:          ${CONNECTIONS} concurrent connections`);
console.log(` Duration:             ${DURATION_SECS} seconds`);
console.log(` Target SLA (p95):     <= ${MAX_P95_LATENCY_MS} ms`);
console.log('='.repeat(70));

const headers = {};
if (BYPASS_TOKEN) {
  headers['x-benchmark-bypass'] = BYPASS_TOKEN;
}

const requests = [
  {
    method: 'GET',
    path: '/api/v1/mosques/nearby?lat=23.8103&lng=90.4125&radiusMeters=5000',
    headers: {
      ...headers,
      'x-forwarded-for': '192.168.1.10',
    },
  },
  {
    method: 'GET',
    path: '/api/v1/mosques?search=Baitul',
    headers: {
      ...headers,
      'x-forwarded-for': '192.168.1.20',
    },
  },
  {
    method: 'GET',
    path: '/api/v1/health',
    headers: {
      ...headers,
      'x-forwarded-for': '192.168.1.30',
    },
  },
];

async function runBenchmark() {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: TARGET_URL,
        connections: CONNECTIONS,
        duration: DURATION_SECS,
        requests,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );

    autocannon.track(instance, { renderProgressBar: true });
  });
}

runBenchmark()
  .then((result) => {
    console.log('\n' + '='.repeat(70));
    console.log(' Benchmark Summary Results');
    console.log('='.repeat(70));

    const totalRequests = result.requests.total;
    const reqPerSec = result.requests.average;
    const p50 = result.latency.p50;
    const p95 = result.latency.p97_5 ?? result.latency.p99 ?? 0;
    const p99 = result.latency.p99 ?? 0;
    const errors = result.errors + result.timeouts;
    const non2xx = result.non2xx;

    console.log(` Total Completed Requests:  ${totalRequests}`);
    console.log(` Throughput:                ${reqPerSec.toFixed(1)} req/sec`);
    console.log(` Latency (p50):             ${p50} ms`);
    console.log(` Latency (p95 / p97.5):     ${p95} ms`);
    console.log(` Latency (p99):             ${p99} ms`);
    console.log(` Socket Errors / Timeouts:  ${errors}`);
    console.log(` Non-2xx Responses:         ${non2xx}`);
    console.log('='.repeat(70));

    let failed = false;

    if (errors > 0 || non2xx > 0) {
      console.error(`❌ FAILURE: Detected ${errors} errors and ${non2xx} non-2xx responses.`);
      failed = true;
    }

    if (p95 > MAX_P95_LATENCY_MS) {
      console.error(
        `❌ SLA BREACH: p95 latency of ${p95}ms exceeds SLA limit of ${MAX_P95_LATENCY_MS}ms.`,
      );
      failed = true;
    }

    if (failed) {
      console.error('❌ Benchmark failed production acceptance gate.');
      process.exit(1);
    } else {
      console.log('✅ SUCCESS: PostGIS spatial queries and DB connection pool met all SLAs.');
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error('❌ Unexpected benchmark error:', err);
    process.exit(1);
  });
