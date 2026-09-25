import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '@app/database';
import { NotFoundException } from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      mosque: {
        findUnique: jest.fn(),
      },
      userMosqueAttendance: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(10),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('setAttendance', () => {
    it('should throw NotFoundException if mosque does not exist', async () => {
      prisma.mosque.findUnique.mockResolvedValue(null);

      await expect(
        service.setAttendance('invalid-mosque', 'user-1', {
          status: AttendanceStatus.REGULAR,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should idempotently upsert attendance status', async () => {
      prisma.mosque.findUnique.mockResolvedValue({
        id: 'mosque-1',
        name: 'Test Mosque',
      });
      prisma.userMosqueAttendance.upsert.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        mosqueId: 'mosque-1',
        status: AttendanceStatus.REGULAR,
      });

      const result = await service.setAttendance('mosque-1', 'user-1', {
        status: AttendanceStatus.REGULAR,
      });

      expect(result.record.status).toBe(AttendanceStatus.REGULAR);
      expect(prisma.userMosqueAttendance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_mosqueId: { userId: 'user-1', mosqueId: 'mosque-1' },
          },
        }),
      );
    });
  });

  describe('removeAttendance', () => {
    it('should delete existing attendance affiliation idempotently', async () => {
      prisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      prisma.userMosqueAttendance.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        mosqueId: 'mosque-1',
      });
      prisma.userMosqueAttendance.delete.mockResolvedValue({});

      const result = await service.removeAttendance('mosque-1', 'user-1');

      expect(result.cleared).toBe(true);
      expect(prisma.userMosqueAttendance.delete).toHaveBeenCalledWith({
        where: { id: 'att-1' },
      });
    });
  });
});
