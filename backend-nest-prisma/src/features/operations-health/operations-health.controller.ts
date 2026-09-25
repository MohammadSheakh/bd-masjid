import { Controller, Get, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, Roles, RolesGuard } from '@app/common';
import { OperationsHealthService } from './operations-health.service';

@ApiTags('Health & Operations')
@Controller()
export class OperationsHealthController {
  constructor(private readonly operationsHealth: OperationsHealthService) {}

  @Get('health/live')
  @ApiOperation({ summary: 'Liveness probe', description: 'Returns 200 if process is running' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  getLiveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('health/ready')
  @ApiOperation({ summary: 'Readiness probe', description: 'Returns 200 if database and dependencies are ready' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async getReadiness() {
    const check = await this.operationsHealth.checkReadiness();
    if (!check.ready) {
      throw new ServiceUnavailableException(check.reason);
    }
    return { status: 'ready', timestamp: new Date().toISOString() };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/operations/health')
  @ApiOperation({ summary: 'Admin diagnostic health', description: 'Detailed health and latency metrics' })
  getDetailedHealth() {
    return this.operationsHealth.getHealth();
  }
}
