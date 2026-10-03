import request from 'supertest';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  AuthGuard,
  RolesGuard,
  SlidingWindowRateLimitGuard,
  TransformResponseInterceptor,
  UserPayload,
} from '@app/common';
import { SuggestionsController } from '../suggestions.controller';
import { SuggestionsService } from '../suggestions.service';
import { CreateSuggestionDto } from '../dto/create-suggestion.dto';
import { CreateReportDto } from '../dto/create-report.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { ReportType, SuggestionStatus, UserRole } from '@prisma/client';

describe('SuggestionsController', () => {
  let controller: SuggestionsController;
  let service: jest.Mocked<SuggestionsService>;

  const mockUser: UserPayload = {
    userId: 'user-1',
    email: 'user@example.com',
    role: UserRole.MEMBER,
  };

  const mockAdmin: UserPayload = {
    userId: 'admin-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  beforeEach(() => {
    service = {
      createSuggestion: jest.fn(),
      createReport: jest.fn(),
      getSuggestions: jest.fn(),
      updateSuggestionStatus: jest.fn(),
      getReports: jest.fn(),
      updateReportStatus: jest.fn(),
    } as unknown as jest.Mocked<SuggestionsService>;

    controller = new SuggestionsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSuggestion', () => {
    it('should delegate suggestion creation to service', async () => {
      const dto: CreateSuggestionDto = {
        proposedChanges: { address: 'New address' },
        reason: 'Typo in street number',
      };
      const response = { id: 'sugg-1', ...dto };
      service.createSuggestion.mockResolvedValue(response as any);

      const result = await controller.createSuggestion(
        'mosque-1',
        dto,
        mockUser,
      );

      expect(service.createSuggestion).toHaveBeenCalledWith(
        'mosque-1',
        dto,
        'user-1',
      );
      expect(result).toEqual(response);
    });
  });

  describe('createReport', () => {
    it('should delegate report creation to service', async () => {
      const dto: CreateReportDto = {
        type: ReportType.PRAYER_TIME,
        description: 'Asr time is 15 minutes late',
      };
      const response = { id: 'report-1', ...dto };
      service.createReport.mockResolvedValue(response as any);

      const result = await controller.createReport('mosque-1', dto, mockUser);

      expect(service.createReport).toHaveBeenCalledWith(
        'mosque-1',
        dto,
        'user-1',
      );
      expect(result).toEqual(response);
    });
  });

  describe('getSuggestions', () => {
    it('should delegate to service with filters and pagination', async () => {
      const list = { suggestions: [{ id: 'sugg-1' }], total: 1 };
      service.getSuggestions.mockResolvedValue(list as any);

      const result = await controller.getSuggestions(
        SuggestionStatus.PENDING,
        'mosque-1',
        1,
        10,
      );

      expect(service.getSuggestions).toHaveBeenCalledWith(
        SuggestionStatus.PENDING,
        'mosque-1',
        1,
        10,
      );
      expect(result).toEqual(list);
    });
  });

  describe('updateSuggestionStatus', () => {
    it('should delegate status update to service', async () => {
      const dto: UpdateStatusDto = {
        status: SuggestionStatus.RESOLVED,
        reviewNotes: 'Corrected in database',
      };
      const response = { id: 'sugg-1', status: SuggestionStatus.RESOLVED };
      service.updateSuggestionStatus.mockResolvedValue(response as any);

      const result = await controller.updateSuggestionStatus(
        'sugg-1',
        dto,
        mockAdmin,
      );

      expect(service.updateSuggestionStatus).toHaveBeenCalledWith(
        'sugg-1',
        dto,
        mockAdmin,
      );
      expect(result).toEqual(response);
    });
  });

  describe('getReports', () => {
    it('should delegate to service with type, status, and pagination', async () => {
      const list = { reports: [{ id: 'report-1' }], total: 1 };
      service.getReports.mockResolvedValue(list as any);

      const result = await controller.getReports(
        SuggestionStatus.PENDING,
        ReportType.INCORRECT_LOCATION,
        'mosque-1',
        1,
        10,
      );

      expect(service.getReports).toHaveBeenCalledWith(
        SuggestionStatus.PENDING,
        ReportType.INCORRECT_LOCATION,
        'mosque-1',
        1,
        10,
      );
      expect(result).toEqual(list);
    });
  });

  describe('updateReportStatus', () => {
    it('should delegate report resolution to service', async () => {
      const dto: UpdateStatusDto = {
        status: SuggestionStatus.RESOLVED,
        reviewNotes: 'Location fixed on map',
      };
      const response = { id: 'report-1', status: SuggestionStatus.RESOLVED };
      service.updateReportStatus.mockResolvedValue(response as any);

      const result = await controller.updateReportStatus(
        'report-1',
        dto,
        mockAdmin,
      );

      expect(service.updateReportStatus).toHaveBeenCalledWith(
        'report-1',
        dto,
        mockAdmin,
      );
      expect(result).toEqual(response);
    });
  });

  describe('HTTP Pipeline & Validation Boundary (Supertest)', () => {
    let app: any;
    let serviceMock: any;

    beforeAll(async () => {
      serviceMock = {
        createSuggestion: jest.fn().mockResolvedValue({
          id: 'sugg-1',
          status: SuggestionStatus.PENDING,
        }),
        createReport: jest.fn().mockResolvedValue({
          id: 'report-1',
          status: SuggestionStatus.PENDING,
        }),
      };

      const moduleRef = await Test.createTestingModule({
        controllers: [SuggestionsController],
        providers: [{ provide: SuggestionsService, useValue: serviceMock }],
      })
        .overrideGuard(AuthGuard)
        .useValue({
          canActivate: (context: any) => {
            const reflector = new (require('@nestjs/core').Reflector)();
            const isPublic = reflector.getAllAndOverride(
              require('@app/common').IS_PUBLIC_KEY,
              [context.getHandler(), context.getClass()],
            );
            const req = context.switchToHttp().getRequest();
            const auth = req.headers['authorization'];
            if (auth && auth.startsWith('Bearer valid')) {
              req.user = mockAdmin;
              return true;
            }
            if (isPublic) {
              return true;
            }
            throw new (require('@nestjs/common').UnauthorizedException)();
          },
        })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(SlidingWindowRateLimitGuard)
        .useValue({ canActivate: () => true })
        .compile();

      app = moduleRef.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
      );
      app.useGlobalInterceptors(new TransformResponseInterceptor());
      await app.init();
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('rejects POST /mosques/:id/suggestions with 400 when suggestedTimes is not an object', async () => {
      const res = await request(app.getHttpServer())
        .post('/mosques/mosque-1/suggestions')
        .send({ suggestedTimes: 'invalid-not-an-object' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('rejects POST /mosques/:id/reports with 400 when report type enum is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/mosques/mosque-1/reports')
        .send({
          type: 'INVALID_REPORT_TYPE',
          description: 'Fajr time is listed 30 minutes too early',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('accepts public POST /mosques/:id/reports with valid payload and wraps in envelope', async () => {
      const res = await request(app.getHttpServer())
        .post('/mosques/mosque-1/reports')
        .send({
          type: ReportType.PRAYER_TIME,
          description: 'Fajr time is listed 30 minutes too early',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.id).toBe('report-1');
    });

    it('rejects PATCH /admin/suggestions/:id/status with 401 when no bearer token is supplied', async () => {
      const res = await request(app.getHttpServer())
        .patch('/admin/suggestions/sugg-1/status')
        .send({ status: SuggestionStatus.RESOLVED });

      expect(res.status).toBe(401);
    });
  });
});
