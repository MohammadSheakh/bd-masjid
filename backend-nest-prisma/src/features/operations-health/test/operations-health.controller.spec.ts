import { ServiceUnavailableException } from '@nestjs/common';
import { OperationsHealthController } from '../operations-health.controller';
import { OperationsHealthService } from '../operations-health.service';

describe('OperationsHealthController', () => {
  let controller: OperationsHealthController;
  let service: jest.Mocked<OperationsHealthService>;

  beforeEach(() => {
    service = {
      checkReadiness: jest.fn(),
      getHealth: jest.fn(),
    } as unknown as jest.Mocked<OperationsHealthService>;

    controller = new OperationsHealthController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLiveness', () => {
    it('should return ok with timestamp', () => {
      const result = controller.getLiveness();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getReadiness', () => {
    it('should return ready status when database is healthy', async () => {
      service.checkReadiness.mockResolvedValue({ ready: true });

      const result = await controller.getReadiness();

      expect(result.status).toBe('ready');
      expect(result.timestamp).toBeDefined();
    });

    it('should throw ServiceUnavailableException when dependencies are not ready', async () => {
      service.checkReadiness.mockResolvedValue({
        ready: false,
        reason: 'Database ping timeout',
      });

      await expect(controller.getReadiness()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('getDetailedHealth', () => {
    it('should delegate to operations health service', async () => {
      const detailed = {
        database: 'connected',
        latencyMs: 4,
        memoryUsageMb: 85,
      };
      service.getHealth.mockResolvedValue(detailed as any);

      const result = await controller.getDetailedHealth();

      expect(service.getHealth).toHaveBeenCalled();
      expect(result).toEqual(detailed);
    });
  });
});
