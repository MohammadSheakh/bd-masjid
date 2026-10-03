import request from 'supertest';
import {
  INestApplication,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { AuthGuard, RolesGuard, ROLES_KEY } from '@app/common';
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

  describe('HTTP Route Integration (Supertest)', () => {
    let app: INestApplication;
    let mockOpsHealthService: {
      checkReadiness: jest.Mock;
      getHealth: jest.Mock;
    };

    beforeAll(async () => {
      mockOpsHealthService = {
        checkReadiness: jest.fn().mockResolvedValue({ ready: true }),
        getHealth: jest.fn().mockResolvedValue({
          database: 'connected',
          latencyMs: 3,
          memoryUsageMb: 75,
        }),
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        controllers: [OperationsHealthController],
        providers: [
          { provide: OperationsHealthService, useValue: mockOpsHealthService },
        ],
      })
        .overrideGuard(AuthGuard)
        .useValue({
          canActivate: (context: ExecutionContext) => {
            const req = context.switchToHttp().getRequest();
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              throw new UnauthorizedException('Authentication token missing');
            }

            if (authHeader === 'Bearer admin-token') {
              req.user = { userId: 'admin-1', role: 'admin' };
            } else {
              req.user = { userId: 'user-1', role: 'member' };
            }
            return true;
          },
        })
        .overrideGuard(RolesGuard)
        .useValue({
          canActivate: (context: ExecutionContext) => {
            const reflector = new Reflector();
            const requiredRoles = reflector.getAllAndOverride<string[]>(
              ROLES_KEY,
              [context.getHandler(), context.getClass()],
            );
            if (!requiredRoles || requiredRoles.length === 0) return true;

            const req = context.switchToHttp().getRequest();
            const user = req.user;
            if (!user || !requiredRoles.includes(user.role)) {
              throw new ForbiddenException('Insufficient role permissions');
            }
            return true;
          },
        })
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /health/live - returns 200 OK with timestamp', async () => {
      const res = await request(app.getHttpServer()).get('/health/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });

    it('GET /health/ready - returns 200 when database ping is successful', async () => {
      mockOpsHealthService.checkReadiness.mockResolvedValueOnce({
        ready: true,
      });
      const res = await request(app.getHttpServer()).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
    });

    it('GET /health/ready - returns 503 Service Unavailable when dependency is down', async () => {
      mockOpsHealthService.checkReadiness.mockResolvedValueOnce({
        ready: false,
        reason: 'Database unreachable',
      });
      const res = await request(app.getHttpServer()).get('/health/ready');
      expect(res.status).toBe(503);
    });

    it('GET /admin/operations/health - returns 401 when unauthenticated', async () => {
      const res = await request(app.getHttpServer()).get(
        '/admin/operations/health',
      );
      expect(res.status).toBe(401);
    });

    it('GET /admin/operations/health - returns 403 when authenticated as non-admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/operations/health')
        .set('Authorization', 'Bearer member-token');

      expect(res.status).toBe(403);
    });

    it('GET /admin/operations/health - returns 200 when authenticated as admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/operations/health')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.database).toBe('connected');
    });
  });
});
