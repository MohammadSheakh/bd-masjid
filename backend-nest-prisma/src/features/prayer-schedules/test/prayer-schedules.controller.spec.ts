import { PrayerSchedulesController } from '../prayer-schedules.controller';
import { PrayerSchedulesService } from '../prayer-schedules.service';
import { UpdatePrayerScheduleDto } from '../dto/update-prayer-schedule.dto';
import { UserPayload } from '@app/common';
import { UserRole } from '@prisma/client';

describe('PrayerSchedulesController', () => {
  let controller: PrayerSchedulesController;
  let service: jest.Mocked<PrayerSchedulesService>;

  const mockActor: UserPayload = {
    userId: 'user-imam-1',
    email: 'imam@mosque.org',
    role: UserRole.MEMBER,
  };

  const mockSchedule = {
    id: 'schedule-1',
    mosqueId: 'mosque-1',
    fajrAzan: '05:00',
    fajrIqamah: '05:15',
    dhuhrAzan: '12:30',
    dhuhrIqamah: '13:00',
    asrAzan: '16:15',
    asrIqamah: '16:30',
    maghribAzan: '18:10',
    maghribIqamah: '18:15',
    ishaAzan: '19:45',
    ishaIqamah: '20:00',
    jummahAzan: '12:30',
    jummahIqamah: '13:15',
    effectiveDate: new Date(),
  };

  beforeEach(() => {
    service = {
      getCurrentSchedule: jest.fn(),
      updateSchedule: jest.fn(),
      getHistory: jest.fn(),
    } as unknown as jest.Mocked<PrayerSchedulesService>;

    controller = new PrayerSchedulesController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrent', () => {
    it('should retrieve current active timetable and freshness level', async () => {
      const response = { schedule: mockSchedule, freshness: 'FRESH' };
      service.getCurrentSchedule.mockResolvedValue(response as any);

      const result = await controller.getCurrent('mosque-1');

      expect(service.getCurrentSchedule).toHaveBeenCalledWith('mosque-1');
      expect(result).toEqual(response);
    });
  });

  describe('updateSchedule', () => {
    it('should delegate schedule update to service with actor and snapshot audit', async () => {
      const dto: UpdatePrayerScheduleDto = {
        fajrAzan: '05:05',
        fajrIqamah: '05:20',
      };
      const updatedSchedule = { ...mockSchedule, ...dto };
      service.updateSchedule.mockResolvedValue(updatedSchedule as any);

      const result = await controller.updateSchedule('mosque-1', dto, mockActor);

      expect(service.updateSchedule).toHaveBeenCalledWith('mosque-1', dto, mockActor);
      expect(result).toEqual(updatedSchedule);
    });
  });

  describe('getHistory', () => {
    it('should query paginated historical snapshots', async () => {
      const history = { snapshots: [mockSchedule], total: 1 };
      service.getHistory.mockResolvedValue(history as any);

      const result = await controller.getHistory('mosque-1', 1, 10);

      expect(service.getHistory).toHaveBeenCalledWith('mosque-1', 1, 10);
      expect(result).toEqual(history);
    });
  });
});
