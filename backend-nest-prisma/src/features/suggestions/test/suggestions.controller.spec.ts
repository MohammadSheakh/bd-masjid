import { SuggestionsController } from '../suggestions.controller';
import { SuggestionsService } from '../suggestions.service';
import { CreateSuggestionDto } from '../dto/create-suggestion.dto';
import { CreateReportDto } from '../dto/create-report.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { UserPayload } from '@app/common';
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

      const result = await controller.createSuggestion('mosque-1', dto, mockUser);

      expect(service.createSuggestion).toHaveBeenCalledWith('mosque-1', dto, 'user-1');
      expect(result).toEqual(response);
    });
  });

  describe('createReport', () => {
    it('should delegate report creation to service', async () => {
      const dto: CreateReportDto = {
        type: ReportType.WRONG_PRAYER_TIMES,
        description: 'Asr time is 15 minutes late',
      };
      const response = { id: 'report-1', ...dto };
      service.createReport.mockResolvedValue(response as any);

      const result = await controller.createReport('mosque-1', dto, mockUser);

      expect(service.createReport).toHaveBeenCalledWith('mosque-1', dto, 'user-1');
      expect(result).toEqual(response);
    });
  });

  describe('getSuggestions', () => {
    it('should delegate to service with filters and pagination', async () => {
      const list = { suggestions: [{ id: 'sugg-1' }], total: 1 };
      service.getSuggestions.mockResolvedValue(list as any);

      const result = await controller.getSuggestions(SuggestionStatus.PENDING, 'mosque-1', 1, 10);

      expect(service.getSuggestions).toHaveBeenCalledWith(SuggestionStatus.PENDING, 'mosque-1', 1, 10);
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

      const result = await controller.updateSuggestionStatus('sugg-1', dto, mockAdmin);

      expect(service.updateSuggestionStatus).toHaveBeenCalledWith('sugg-1', dto, mockAdmin);
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

      const result = await controller.updateReportStatus('report-1', dto, mockAdmin);

      expect(service.updateReportStatus).toHaveBeenCalledWith('report-1', dto, mockAdmin);
      expect(result).toEqual(response);
    });
  });
});
