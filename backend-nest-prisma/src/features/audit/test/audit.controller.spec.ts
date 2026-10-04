import { AuditController } from '../audit.controller';
import { AuditService } from '../audit.service';

describe('AuditController', () => {
  let controller: AuditController;
  let auditService: {
    getAuditLogs: jest.Mock;
    getConfig: jest.Mock;
    updateConfig: jest.Mock;
  };

  beforeEach(() => {
    auditService = {
      getAuditLogs: jest.fn(),
      getConfig: jest.fn(),
      updateConfig: jest.fn(),
    };

    controller = new AuditController(auditService as unknown as AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getConfig', () => {
    it('delegates to auditService.getConfig', async () => {
      const mockConfig = { enabled: true, updatedAt: new Date(), updatedBy: null };
      auditService.getConfig.mockResolvedValue(mockConfig);

      const result = await controller.getConfig();
      expect(result).toBe(mockConfig);
      expect(auditService.getConfig).toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    it('delegates to auditService.updateConfig with enabled and actor userId', async () => {
      const mockResult = { enabled: false, updatedAt: new Date(), updatedBy: 'admin-usr-1' };
      auditService.updateConfig.mockResolvedValue(mockResult);

      const actor = {
        userId: 'admin-usr-1',
        email: 'admin@bdmasjid.com',
        role: 'admin',
        permissions: ['audit.read'],
      } as any;

      const result = await controller.updateConfig({ enabled: false }, actor);
      expect(result).toBe(mockResult);
      expect(auditService.updateConfig).toHaveBeenCalledWith(false, 'admin-usr-1');
    });
  });

  describe('getAuditLogs', () => {
    it('delegates query to auditService.getAuditLogs', async () => {
      const mockResponse = { items: [], total: 0 };
      auditService.getAuditLogs.mockResolvedValue(mockResponse);

      const query = { page: 1, limit: 10 };
      const result = await controller.getAuditLogs(query as any);
      expect(result).toBe(mockResponse);
      expect(auditService.getAuditLogs).toHaveBeenCalledWith(query);
    });
  });
});
