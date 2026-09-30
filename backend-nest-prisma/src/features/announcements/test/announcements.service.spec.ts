import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AnnouncementCategory, MosqueStaffRole } from '@prisma/client';
import { PrismaService } from '@app/database';
import { UserPayload } from '@app/common';
import { AuditService } from '../../audit/audit.service';
import { AnnouncementsService } from '../announcements.service';

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  let prisma: any;
  let audit: any;

  const mockAdminUser: UserPayload = {
    userId: 'admin-1',
    role: 'admin',
    email: 'admin@platform.com',
  };

  const mockStaffUser: UserPayload = {
    userId: 'imam-1',
    role: 'user',
    email: 'imam@mosque.com',
  };

  const mockMosqueAdminUser: UserPayload = {
    userId: 'mutawalli-1',
    role: 'user',
    email: 'mutawalli@mosque.com',
  };

  const mockRegularUser: UserPayload = {
    userId: 'musalli-1',
    role: 'user',
    email: 'musalli@gmail.com',
  };

  beforeEach(async () => {
    prisma = {
      mosque: {
        findUnique: jest.fn(),
      },
      mosqueStaff: {
        findFirst: jest.fn(),
      },
      mosqueAnnouncement: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      mosqueBookmark: {
        findMany: jest.fn(),
      },
      $queryRaw: jest.fn(),
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    audit = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<AnnouncementsService>(AnnouncementsService);
  });

  describe('getMosqueAnnouncements', () => {
    it('throws NotFoundException if mosque does not exist', async () => {
      prisma.mosque.findUnique.mockResolvedValue(null);

      await expect(
        service.getMosqueAnnouncements('invalid-id', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns active announcements excluding expired ones by default', async () => {
      prisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      prisma.mosqueAnnouncement.findMany.mockResolvedValue([
        { id: 'ann-1', title: 'Notice 1', isPinned: true },
      ]);
      prisma.mosqueAnnouncement.count.mockResolvedValue(1);

      const result = await service.getMosqueAnnouncements('mosque-1', {});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(prisma.mosqueAnnouncement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            mosqueId: 'mosque-1',
            OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
          }),
        }),
      );
    });

    it('allows expired announcements when includeExpired=true and user is verified staff', async () => {
      prisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      prisma.mosqueStaff.findFirst.mockResolvedValue({
        id: 'staff-1',
        isVerified: true,
      });
      prisma.mosqueAnnouncement.findMany.mockResolvedValue([]);
      prisma.mosqueAnnouncement.count.mockResolvedValue(0);

      await service.getMosqueAnnouncements(
        'mosque-1',
        { includeExpired: true },
        mockStaffUser,
      );

      expect(prisma.mosqueAnnouncement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { mosqueId: 'mosque-1' },
        }),
      );
    });
  });

  describe('createAnnouncement', () => {
    it('throws ForbiddenException if user is not verified staff of mosque', async () => {
      prisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      prisma.mosqueStaff.findFirst.mockResolvedValue(null);

      await expect(
        service.createAnnouncement(
          'mosque-1',
          { title: 'Test Title', content: 'Valid announcement content text.' },
          mockRegularUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException if regular staff posts EMERGENCY_ALERT', async () => {
      prisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      prisma.mosqueStaff.findFirst.mockResolvedValue({
        id: 'staff-1',
        role: MosqueStaffRole.IMAM,
        isVerified: true,
      });

      await expect(
        service.createAnnouncement(
          'mosque-1',
          {
            title: 'Flood Alert',
            content: 'Emergency alert message text here.',
            category: AnnouncementCategory.EMERGENCY_ALERT,
          },
          mockStaffUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows MOSQUE_ADMIN to post EMERGENCY_ALERT', async () => {
      prisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      prisma.mosqueStaff.findFirst.mockResolvedValue({
        id: 'staff-2',
        role: MosqueStaffRole.MOSQUE_ADMIN,
        isVerified: true,
      });
      prisma.mosqueAnnouncement.count.mockResolvedValue(0);
      prisma.mosqueAnnouncement.create.mockResolvedValue({
        id: 'ann-em',
        category: AnnouncementCategory.EMERGENCY_ALERT,
        authorRole: 'MOSQUE_ADMIN',
      });

      const res = await service.createAnnouncement(
        'mosque-1',
        {
          title: 'Flood Alert',
          content: 'Emergency shelter open on ground floor.',
          category: AnnouncementCategory.EMERGENCY_ALERT,
        },
        mockMosqueAdminUser,
      );

      expect(res.category).toBe(AnnouncementCategory.EMERGENCY_ALERT);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MOSQUE_ANNOUNCEMENT_CREATED' }),
        expect.anything(),
      );
    });

    it('throws BadRequestException if pin ceiling of 3 is reached', async () => {
      prisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      prisma.mosqueStaff.findFirst.mockResolvedValue({
        id: 'staff-1',
        role: MosqueStaffRole.IMAM,
        isVerified: true,
      });
      prisma.mosqueAnnouncement.count.mockResolvedValue(3);

      await expect(
        service.createAnnouncement(
          'mosque-1',
          {
            title: 'New Notice',
            content: 'Notice content that Musallis will read.',
            isPinned: true,
          },
          mockStaffUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if expiration date is in the past', async () => {
      prisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      prisma.mosqueStaff.findFirst.mockResolvedValue({
        id: 'staff-1',
        role: MosqueStaffRole.IMAM,
        isVerified: true,
      });

      await expect(
        service.createAnnouncement(
          'mosque-1',
          {
            title: 'Notice',
            content: 'Notice content for past timestamp testing.',
            expiresAt: '2020-01-01T00:00:00.000Z',
          },
          mockStaffUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateAnnouncement', () => {
    it('allows author to update announcement', async () => {
      prisma.mosqueAnnouncement.findUnique.mockResolvedValue({
        id: 'ann-1',
        mosqueId: 'mosque-1',
        authorId: mockStaffUser.userId,
        isPinned: false,
      });
      prisma.mosqueAnnouncement.update.mockResolvedValue({
        id: 'ann-1',
        title: 'Updated Title',
      });

      const res = await service.updateAnnouncement(
        'ann-1',
        { title: 'Updated Title' },
        mockStaffUser,
      );

      expect(res.title).toBe('Updated Title');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MOSQUE_ANNOUNCEMENT_UPDATED' }),
        expect.anything(),
      );
    });

    it('allows MOSQUE_ADMIN to update even if not the author', async () => {
      prisma.mosqueAnnouncement.findUnique.mockResolvedValue({
        id: 'ann-1',
        mosqueId: 'mosque-1',
        authorId: 'other-author',
        isPinned: false,
      });
      prisma.mosqueStaff.findFirst.mockResolvedValue({
        id: 'staff-adm',
        role: MosqueStaffRole.MOSQUE_ADMIN,
        isVerified: true,
      });
      prisma.mosqueAnnouncement.update.mockResolvedValue({
        id: 'ann-1',
        title: 'Admin Edited',
      });

      const res = await service.updateAnnouncement(
        'ann-1',
        { title: 'Admin Edited' },
        mockMosqueAdminUser,
      );

      expect(res.title).toBe('Admin Edited');
    });

    it('throws ForbiddenException if unauthorized user tries to update', async () => {
      prisma.mosqueAnnouncement.findUnique.mockResolvedValue({
        id: 'ann-1',
        mosqueId: 'mosque-1',
        authorId: 'other-author',
      });
      prisma.mosqueStaff.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAnnouncement('ann-1', { title: 'Hacked' }, mockRegularUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteAnnouncement', () => {
    it('allows author or admin to delete', async () => {
      prisma.mosqueAnnouncement.findUnique.mockResolvedValue({
        id: 'ann-1',
        mosqueId: 'mosque-1',
        authorId: mockStaffUser.userId,
      });
      prisma.mosqueAnnouncement.delete.mockResolvedValue({ id: 'ann-1' });

      const res = await service.deleteAnnouncement('ann-1', mockStaffUser);

      expect(res.deleted).toBe(true);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MOSQUE_ANNOUNCEMENT_DELETED' }),
        expect.anything(),
      );
    });
  });

  describe('getAnnouncementsFeed', () => {
    it('throws UnauthorizedException if bookmarkedOnly is true without authenticated user', async () => {
      await expect(
        service.getAnnouncementsFeed({ bookmarkedOnly: true }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns empty array when user has no bookmarked mosques', async () => {
      prisma.mosqueBookmark.findMany.mockResolvedValue([]);

      const res = await service.getAnnouncementsFeed(
        { bookmarkedOnly: true },
        mockRegularUser,
      );

      expect(res.data).toEqual([]);
      expect(res.total).toBe(0);
    });

    it('executes PostGIS spatial query when lat & lng are provided', async () => {
      prisma.$queryRaw.mockResolvedValue([
        {
          id: 'ann-geo',
          mosqueName: 'Nearby Mosque',
          distanceMeters: 450,
          title: 'Nearby Notice',
        },
      ]);

      const res = await service.getAnnouncementsFeed({
        lat: 23.8103,
        lng: 90.4125,
        radiusKm: 5,
      });

      expect(res.data).toHaveLength(1);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });
  });
});
