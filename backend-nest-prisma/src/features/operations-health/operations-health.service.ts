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
    const postgis = await this.postgisProbe();
    const system = {
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      nodeVersion: process.version,
    };

    const metrics = RequestMetrics.snapshot();

    return {
      status: database.available && postgis.available ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies: {
        database,
        postgis,
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
        detail:
          error instanceof Error ? error.message : 'Database probe failed',
      };
    }
  }

  private async postgisProbe(): Promise<DependencyProbe> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT ST_Distance(ST_SetSRID(ST_MakePoint(90.4125, 23.8103), 4326)::geography, ST_SetSRID(ST_MakePoint(90.4125, 23.8103), 4326)::geography)`;
      return {
        available: true,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        available: false,
        latencyMs: Date.now() - start,
        detail:
          error instanceof Error ? error.message : 'PostGIS probe failed',
      };
    }
  }
}
