import type { Request, Response } from 'express';
import request from 'supertest';
import {
  INestApplication,
  ValidationPipe,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard, SlidingWindowRateLimitGuard } from '@app/common';

jest.mock('../auth.service', () => ({ AuthService: class AuthService {} }));
jest.mock('../../two-factor/two-factor.service', () => ({
  TwoFactorService: class TwoFactorService {},
}));

import { AuthService } from '../auth.service';
import { TwoFactorService } from '../../two-factor/two-factor.service';
import { AuthController } from '../auth.controller';

describe('AuthController native session contract', () => {
  const authService = {
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };
  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;
  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authService as never, {} as never);
  });

  it('rotates a refresh token supplied by a native client body', async () => {
    authService.refreshToken.mockResolvedValue({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    });

    await expect(
      controller.refresh(
        { headers: {} } as Request,
        { refreshToken: 'native-refresh-token-value' },
        response,
      ),
    ).resolves.toEqual({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    });
    expect(authService.refreshToken).toHaveBeenCalledWith(
      'native-refresh-token-value',
    );
  });

  it('revokes a refresh token supplied by a native client body', async () => {
    authService.logout.mockResolvedValue({ message: 'Logout successful' });

    await controller.logout(
      { headers: {} } as Request,
      { refreshToken: 'native-refresh-token-value' },
      response,
    );

    expect(authService.logout).toHaveBeenCalledWith(
      'native-refresh-token-value',
    );
    expect(response.clearCookie).toHaveBeenCalled();
  });

  it('logs refresh rejection without exposing request credentials', async () => {
    const logger = { warn: jest.fn() };
    (controller as unknown as { logger: typeof logger }).logger = logger;

    await expect(
      controller.refresh({ headers: {} } as Request, {}, response),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(logger.warn).toHaveBeenCalledWith(
      'authentication_refresh_rejected',
      { reason: 'TOKEN_MISSING' },
    );
  });

  describe('HTTP Route Integration (Supertest)', () => {
    let app: INestApplication;
    let mockAuthService: {
      login: jest.Mock;
      refreshToken: jest.Mock;
      logout: jest.Mock;
    };
    let mockTwoFactorService: {
      status: jest.Mock;
    };

    beforeAll(async () => {
      mockAuthService = {
        login: jest.fn().mockResolvedValue({
          user: { id: 'u1', email: 'test@example.com', role: 'MEMBER' },
          accessToken: 'jwt-access-token',
          refreshToken: 'jwt-refresh-token',
        }),
        refreshToken: jest.fn().mockResolvedValue({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        }),
        logout: jest.fn().mockResolvedValue({ message: 'Logout successful' }),
      };

      mockTwoFactorService = {
        status: jest.fn().mockResolvedValue({ enabled: false }),
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          { provide: AuthService, useValue: mockAuthService },
          { provide: TwoFactorService, useValue: mockTwoFactorService },
        ],
      })
        .overrideGuard(SlidingWindowRateLimitGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(AuthGuard)
        .useValue({
          canActivate: (context: ExecutionContext) => {
            const req = context.switchToHttp().getRequest();
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              throw new UnauthorizedException('Authentication token missing');
            }
            req.user = {
              userId: 'u1',
              email: 'test@example.com',
              role: 'MEMBER',
            };
            return true;
          },
        })
        .compile();

      app = moduleRef.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
          forbidNonWhitelisted: true,
        }),
      );
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /auth/session - rejects unauthenticated requests with 401', async () => {
      const res = await request(app.getHttpServer()).get('/auth/session');
      expect(res.status).toBe(401);
    });

    it('GET /auth/session - returns user session with 200 when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/session')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('test@example.com');
    });

    it('POST /auth/login - returns 400 on invalid payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('POST /auth/login - returns 200 and sets cookie on valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBe('jwt-access-token');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('POST /auth/refresh - returns 401 when refresh token missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({});

      expect(res.status).toBe(401);
    });

    it('POST /auth/refresh - returns new tokens with 200 when refresh token in body', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token-12345' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBe('new-access-token');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('POST /auth/logout - returns 200 and clears cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: 'valid-refresh-token-12345' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logout successful');
    });
  });
});
