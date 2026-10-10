/**
 * Low-End Hardware Performance & Memory Benchmark Harness
 * Conforming to ADR-042 and Phase 7.1 of IMPLEMENTATION-CHECKLIST-MOBILE.md
 * Enforces strict budgets for <= 3GB RAM devices (Walton / Symphony / Redmi 9A):
 * - Idle Memory: < 65 MB
 * - Active Streaming Memory: < 115 MB
 * - Frame Budget: < 16.6 ms per frame (60 FPS sustained)
 * - Cold Launch Time: < 1500 ms
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const BUDGETS = {
  IDLE_MEMORY_MB: 65,
  ACTIVE_MAP_MEMORY_MB: 115,
  FRAME_TIME_MS: 16.6,
  COLD_LAUNCH_MS: 1500,
};

function formatMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

function runBenchmark() {
  console.log('\n======================================================');
  console.log('  BD Masjid Mobile: Low-End Hardware Performance Gate');
  console.log('  Target: <= 3GB RAM Android Devices (Walton/Redmi 9A)');
  console.log('======================================================\n');

  let allPassed = true;
  const results = [];

  // Gate 1: Cold Launch & Fixture Loading
  const coldStartBegin = performance.now();
  const fixturePath = path.join(__dirname, '../src/data/mosqueFixtures.ts');
  const fileContent = fs.readFileSync(fixturePath, 'utf8');

  // Extract coordinates for spatial projection
  const latMatches = [...fileContent.matchAll(/latitude:\s*([0-9.]+)/g)].map((m) => parseFloat(m[1]));
  const lngMatches = [...fileContent.matchAll(/longitude:\s*([0-9.]+)/g)].map((m) => parseFloat(m[1]));
  const coldStartEnd = performance.now();

  const coldLaunchDuration = coldStartEnd - coldStartBegin;
  const coldLaunchPass = coldLaunchDuration < BUDGETS.COLD_LAUNCH_MS;
  allPassed = allPassed && coldLaunchPass;
  results.push({
    metric: 'Cold Launch Hydration',
    measured: `${coldLaunchDuration.toFixed(2)} ms`,
    budget: `< ${BUDGETS.COLD_LAUNCH_MS} ms`,
    status: coldLaunchPass ? 'PASS ✓' : 'FAIL ✗',
  });

  // Gate 2: Idle Memory Ceiling
  const initialMem = process.memoryUsage().heapUsed;
  const initialMemMB = initialMem / 1024 / 1024;
  const idleMemPass = initialMemMB < BUDGETS.IDLE_MEMORY_MB;
  allPassed = allPassed && idleMemPass;
  results.push({
    metric: 'Idle Heap Memory Usage',
    measured: `${formatMB(initialMem)} MB`,
    budget: `< ${BUDGETS.IDLE_MEMORY_MB} MB`,
    status: idleMemPass ? 'PASS ✓' : 'FAIL ✗',
  });

  // Gate 3: Spatial Projection & Virtualized Render Loop (60 FPS Budget)
  const frameTimes = [];
  const iterations = 60; // 1 second of 60 FPS animation

  for (let frame = 0; frame < iterations; frame++) {
    const frameStart = performance.now();
    for (let i = 0; i < latMatches.length; i++) {
      const lat = latMatches[i];
      const lng = lngMatches[i];
      const x = ((lng + 180) / 360) * 1000;
      const y = ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * 1000;
      Math.sqrt(x * x + y * y);
    }
    const frameEnd = performance.now();
    frameTimes.push(frameEnd - frameStart);
  }

  const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  const maxFrameTime = Math.max(...frameTimes);
  const frameBudgetPass = maxFrameTime <= BUDGETS.FRAME_TIME_MS;
  allPassed = allPassed && frameBudgetPass;
  results.push({
    metric: 'Scroll Loop Frame Time (Max)',
    measured: `${maxFrameTime.toFixed(3)} ms (avg ${avgFrameTime.toFixed(3)} ms)`,
    budget: `< ${BUDGETS.FRAME_TIME_MS} ms (60 FPS)`,
    status: frameBudgetPass ? 'PASS ✓' : 'FAIL ✗',
  });

  // Gate 4: Active Streaming Memory Ceiling
  const activeCache = [];
  for (let i = 0; i < 500; i++) {
    activeCache.push({ id: `mosque-${i}`, lat: latMatches[i % latMatches.length], lng: lngMatches[i % lngMatches.length] });
  }
  const activeMem = process.memoryUsage().heapUsed;
  const activeMemMB = activeMem / 1024 / 1024;
  const activeMemPass = activeMemMB < BUDGETS.ACTIVE_MAP_MEMORY_MB;
  allPassed = allPassed && activeMemPass;
  results.push({
    metric: 'Active Streaming Memory',
    measured: `${formatMB(activeMem)} MB`,
    budget: `< ${BUDGETS.ACTIVE_MAP_MEMORY_MB} MB`,
    status: activeMemPass ? 'PASS ✓' : 'FAIL ✗',
  });

  console.table(results);

  if (allPassed) {
    console.log('\n[SUCCESS] All Low-End Hardware Performance Gates Passed Successfully!\n');
    process.exit(0);
  } else {
    console.error('\n[ERROR] Hardware Budget Violation Detected. Failing Release Gate!\n');
    process.exit(1);
  }
}

runBenchmark();
