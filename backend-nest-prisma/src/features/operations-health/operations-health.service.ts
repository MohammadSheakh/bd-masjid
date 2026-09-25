import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { RequestMetrics } from '@app/common';

type DependencyProbe = {
  available: boolean;
  latencyMs: number | null;
  detail?: string;
};

@Injectable()
export class OperationsHealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    const database = await this.databaseProbe();
    const system = {
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      nodeVersion: process.version,
    };

    const metrics = RequestMetrics.snapshot();

    return {
      status: database.available ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies: {
        database,
      },
      system,
      metrics,
    };
  }

  async checkReadiness(): Promise<{ ready: boolean; reason?: string }> {
    const db = await this.databaseProbe();
    if (!db.available) {
      return { ready: false, reason: db.detail || 'Database unreachable' };
    }
    return { ready: true };
  }

  private async databaseProbe(): Promise<DependencyProbe> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        available: true,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        available: false,
        latencyMs: Date.now() - start,
        detail: error instanceof Error ? error.message : 'Database probe failed',
      };
    }
  }
}
