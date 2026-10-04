import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@app/database';
import { AuditService } from '../audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: {
    auditLog: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    auditConfig: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      auditConfig: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('initializes audit state as disabled when config in db is disabled', async () => {
      prisma.auditConfig.findUnique.mockResolvedValue({
        id: 'default',
        enabled: false,
        updatedAt: new Date(),
        updatedBy: 'admin-1',
      });

      await service.onModuleInit();
      expect(service.isTrackingEnabled()).toBe(false);
    });

    it('falls back gracefully to enabled when findUnique throws', async () => {
      prisma.auditConfig.findUnique.mockRejectedValue(new Error('DB not reachable'));

      await service.onModuleInit();
      expect(service.isTrackingEnabled()).toBe(true);
    });
  });

  describe('record', () => {
    it('creates audit log when audit tracking is enabled', async () => {
      const createdLog = { id: 'audit-1', action: 'MOSQUE_UPDATE' };
      prisma.auditLog.create.mockResolvedValue(createdLog);

      const result = await service.record({
        action: 'MOSQUE_UPDATE',
        entityType: 'Mosque',
        entityId: 'mosque-123',
        actor: { userId: 'user-1', role: 'admin' },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(createdLog);
    });

    it('bypasses auditLog.create completely when audit tracking is disabled', async () => {
      // Disable tracking
      prisma.auditConfig.upsert.mockResolvedValue({
        id: 'default',
        enabled: false,
        updatedAt: new Date(),
        updatedBy: 'admin-1',
      });
      await service.updateConfig(false, 'admin-1');

      const result = await service.record({
        action: 'PRAYER_TIME_UPDATE',
        entityType: 'PrayerSchedule',
        entityId: 'ps-123',
      });

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getConfig and updateConfig', () => {
    it('returns config from database', async () => {
      const date = new Date();
      prisma.auditConfig.findUnique.mockResolvedValue({
        id: 'default',
        enabled: true,
        updatedAt: date,
        updatedBy: 'admin-1',
      });

      const config = await service.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.updatedBy).toBe('admin-1');
    });

    it('updates config in database and synchronizes in-memory cache', async () => {
      const date = new Date();
      prisma.auditConfig.upsert.mockResolvedValue({
        id: 'default',
        enabled: false,
        updatedAt: date,
        updatedBy: 'admin-1',
      });

      const updated = await service.updateConfig(false, 'admin-1');
      expect(updated.enabled).toBe(false);
      expect(service.isTrackingEnabled()).toBe(false);
      expect(prisma.auditConfig.upsert).toHaveBeenCalledWith({
        where: { id: 'default' },
        create: { id: 'default', enabled: false, updatedBy: 'admin-1' },
        update: { enabled: false, updatedBy: 'admin-1' },
      });
    });
  });
});
