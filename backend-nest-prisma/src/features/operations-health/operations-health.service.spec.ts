import { Test, TestingModule } from '@nestjs/testing';
import { OperationsHealthService } from './operations-health.service';
import { PrismaService } from '@app/database';

describe('OperationsHealthService', () => {
  let service: OperationsHealthService;

  const mockPrisma = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationsHealthService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OperationsHealthService>(OperationsHealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealth', () => {
    it('returns healthy status when database probe succeeds', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const health = await service.getHealth();

      expect(health.status).toBe('healthy');
      expect(health.dependencies.database.available).toBe(true);
      expect(typeof health.dependencies.database.latencyMs).toBe('number');
      expect(health.system.nodeVersion).toBeDefined();
      expect(health.metrics).toBeDefined();
    });

    it('returns degraded status when database query fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection terminated'));

      const health = await service.getHealth();

      expect(health.status).toBe('degraded');
      expect(health.dependencies.database.available).toBe(false);
      expect(health.dependencies.database.detail).toBe('Connection terminated');
    });
  });

  describe('checkReadiness', () => {
    it('returns ready: true when DB is reachable', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([1]);

      const res = await service.checkReadiness();

      expect(res.ready).toBe(true);
      expect(res.reason).toBeUndefined();
    });

    it('returns ready: false with reason when DB is unreachable', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Timeout acquiring connection'));

      const res = await service.checkReadiness();

      expect(res.ready).toBe(false);
      expect(res.reason).toBe('Timeout acquiring connection');
    });
  });
});
