import { AttendanceController } from '../attendance.controller';
import { AttendanceService } from '../attendance.service';
import { SetAttendanceDto } from '../dto/set-attendance.dto';
import { UserPayload } from '@app/common';
import { AttendanceStatus, UserRole } from '@prisma/client';

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let service: jest.Mocked<AttendanceService>;

  const mockUser: UserPayload = {
    userId: 'user-1',
    email: 'user@example.com',
    role: UserRole.MEMBER,
  };

  const mockAttendance = {
    id: 'att-1',
    userId: 'user-1',
    mosqueId: 'mosque-1',
    status: AttendanceStatus.REGULAR,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = {
      setAttendance: jest.fn(),
      removeAttendance: jest.fn(),
      getSummary: jest.fn(),
      getMyMosques: jest.fn(),
    } as unknown as jest.Mocked<AttendanceService>;

    controller = new AttendanceController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('setAttendance', () => {
    it('should delegate attendance marking to service', async () => {
      const dto: SetAttendanceDto = { status: AttendanceStatus.REGULAR };
      service.setAttendance.mockResolvedValue(mockAttendance as any);

      const result = await controller.setAttendance('mosque-1', dto, mockUser);

      expect(service.setAttendance).toHaveBeenCalledWith('mosque-1', 'user-1', dto);
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('removeAttendance', () => {
    it('should delegate attendance removal to service', async () => {
      const response = { success: true };
      service.removeAttendance.mockResolvedValue(response as any);

      const result = await controller.removeAttendance('mosque-1', mockUser);

      expect(service.removeAttendance).toHaveBeenCalledWith('mosque-1', 'user-1');
      expect(result).toEqual(response);
    });
  });

  describe('getSummary', () => {
    it('should retrieve attendance summary with user affiliation when authenticated', async () => {
      const summary = { regularCount: 15, occasionalCount: 4, myStatus: AttendanceStatus.REGULAR };
      service.getSummary.mockResolvedValue(summary as any);

      const result = await controller.getSummary('mosque-1', mockUser);

      expect(service.getSummary).toHaveBeenCalledWith('mosque-1', 'user-1');
      expect(result).toEqual(summary);
    });

    it('should retrieve attendance summary without user affiliation when unauthenticated', async () => {
      const summary = { regularCount: 15, occasionalCount: 4, myStatus: null };
      service.getSummary.mockResolvedValue(summary as any);

      const result = await controller.getSummary('mosque-1', undefined);

      expect(service.getSummary).toHaveBeenCalledWith('mosque-1', undefined);
      expect(result).toEqual(summary);
    });
  });

  describe('getMyMosques', () => {
    it('should retrieve mosques attended by user', async () => {
      const attended = [{ mosqueId: 'mosque-1', status: AttendanceStatus.REGULAR }];
      service.getMyMosques.mockResolvedValue(attended as any);

      const result = await controller.getMyMosques(mockUser);

      expect(service.getMyMosques).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(attended);
    });
  });
});
