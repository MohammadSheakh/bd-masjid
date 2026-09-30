import request from 'supertest';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGuard, SlidingWindowRateLimitGuard, TransformResponseInterceptor, UserPayload } from '@app/common';
import { AnnouncementsController } from '../announcements.controller';
import { AnnouncementsService } from '../announcements.service';
import {
  CreateAnnouncementDto,
  FeedAnnouncementsDto,
  QueryAnnouncementsDto,
  UpdateAnnouncementDto,
} from '../dto';
import { AnnouncementCategory, UserRole } from '@prisma/client';

describe('AnnouncementsController', () => {
  let controller: AnnouncementsController;
  let service: jest.Mocked<AnnouncementsService>;

  const mockUser: UserPayload = {
    userId: 'user-staff-1',
    email: 'staff@mosque.org',
    role: UserRole.MEMBER,
  };

  const mockAnnouncement = {
    id: 'ann-1',
    mosqueId: 'mosque-1',
    title: 'Eid Prayer Timings',
    content: 'First Jamaat at 7:00 AM, Second Jamaat at 8:30 AM',
    category: AnnouncementCategory.GENERAL_ANNOUNCEMENT,
    isPinned: false,
    authorUserId: 'user-staff-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = {
      getAnnouncementsFeed: jest.fn(),
      getMosqueAnnouncements: jest.fn(),
      createAnnouncement: jest.fn(),
      updateAnnouncement: jest.fn(),
      deleteAnnouncement: jest.fn(),
    } as unknown as jest.Mocked<AnnouncementsService>;

    controller = new AnnouncementsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFeed', () => {
    it('should retrieve discovery feed with query dto and user context', async () => {
      const dto: FeedAnnouncementsDto = { latitude: 23.75, longitude: 90.39, radius: 5000 };
      const feed = [mockAnnouncement];
      service.getAnnouncementsFeed.mockResolvedValue(feed as any);

      const result = await controller.getFeed(dto, mockUser);

      expect(service.getAnnouncementsFeed).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(feed);
    });
  });

  describe('getMosqueAnnouncements', () => {
    it('should query announcements for specific mosque', async () => {
      const query: QueryAnnouncementsDto = { page: 1, limit: 10 };
      const list = { announcements: [mockAnnouncement], total: 1 };
      service.getMosqueAnnouncements.mockResolvedValue(list as any);

      const result = await controller.getMosqueAnnouncements('mosque-1', query, mockUser);

      expect(service.getMosqueAnnouncements).toHaveBeenCalledWith('mosque-1', query, mockUser);
      expect(result).toEqual(list);
    });
  });

  describe('createAnnouncement', () => {
    it('should delegate creation to service with mosqueId, dto, and actor', async () => {
      const dto: CreateAnnouncementDto = {
        title: 'Eid Timings',
        content: 'Eid Jamaat details',
        category: AnnouncementCategory.GENERAL_ANNOUNCEMENT,
      };
      service.createAnnouncement.mockResolvedValue(mockAnnouncement as any);

      const result = await controller.createAnnouncement('mosque-1', dto, mockUser);

      expect(service.createAnnouncement).toHaveBeenCalledWith('mosque-1', dto, mockUser);
      expect(result).toEqual(mockAnnouncement);
    });
  });

  describe('updateAnnouncement', () => {
    it('should delegate update to service with announcementId, dto, and actor', async () => {
      const dto: UpdateAnnouncementDto = { title: 'Updated Eid Timings' };
      const updated = { ...mockAnnouncement, title: 'Updated Eid Timings' };
      service.updateAnnouncement.mockResolvedValue(updated as any);

      const result = await controller.updateAnnouncement('ann-1', dto, mockUser);

      expect(service.updateAnnouncement).toHaveBeenCalledWith('ann-1', dto, mockUser);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteAnnouncement', () => {
    it('should delegate deletion to service with announcementId and actor', async () => {
      const deleteResponse = { success: true };
      service.deleteAnnouncement.mockResolvedValue(deleteResponse as any);

      const result = await controller.deleteAnnouncement('ann-1', mockUser);

      expect(service.deleteAnnouncement).toHaveBeenCalledWith('ann-1', mockUser);
      expect(result).toEqual(deleteResponse);
    });
  });

  describe('HTTP Pipeline & Validation Boundary (Supertest)', () => {
    let app: any;
    let serviceMock: any;

    beforeAll(async () => {
      serviceMock = {
        getAnnouncementsFeed: jest.fn().mockResolvedValue([mockAnnouncement]),
        createAnnouncement: jest.fn().mockResolvedValue(mockAnnouncement),
      };

      const moduleRef = await Test.createTestingModule({
        controllers: [AnnouncementsController],
        providers: [
          { provide: AnnouncementsService, useValue: serviceMock },
        ],
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
              req.user = mockUser;
              return true;
            }
            if (isPublic) {
              return true;
            }
            throw new (require('@nestjs/common').UnauthorizedException)();
          },
        })
        .overrideGuard(SlidingWindowRateLimitGuard)
        .useValue({ canActivate: () => true })
        .compile();

      app = moduleRef.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      app.useGlobalInterceptors(new TransformResponseInterceptor());
      await app.init();
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('publicly returns feed with 200 on GET /announcements/feed', async () => {
      const res = await request(app.getHttpServer())
        .get('/announcements/feed');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('rejects POST /announcements/mosques/:id with 401 when no bearer token is supplied', async () => {
      const res = await request(app.getHttpServer())
        .post('/announcements/mosques/mosque-1')
        .send({
          title: 'Emergency Notice',
          content: 'Details here',
        });

      expect(res.status).toBe(401);
    });

    it('rejects POST /announcements/mosques/:id with 400 when title or content is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/announcements/mosques/mosque-1')
        .set('Authorization', 'Bearer valid-staff-token')
        .send({
          title: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });
});
