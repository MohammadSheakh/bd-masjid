/**
 * Low-End Hardware Diagnostics & Field Ops Domain Types (ADR-040, ADR-042, ADR-059)
 */

export interface DeviceHardwareMetrics {
  fps: number;
  frameTimeMs: number;
  heapUsedMb: number;
  heapBudgetMb: number;
  coldLaunchMs: number;
  isMemoryConstrained: boolean;
  networkLatencyMs: number;
  cacheEntriesCount: number;
  outboxPendingCount: number;
  osPlatform: string;
}

export interface SanitizedDiagnosticReport {
  generatedAt: string;
  appVersion: string;
  osPlatform: string;
  metrics: DeviceHardwareMetrics;
  storageSummary: {
    outboxCount: number;
    cacheEntries: number;
  };
  recentBreadcrumbs: string[];
}
