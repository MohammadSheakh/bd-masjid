import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthGuard,
  PERMISSIONS,
  Permissions,
  PermissionsGuard,
  Roles,
  RolesGuard,
  User as CurrentUser,
  type UserPayload,
} from '@app/common';
import { AuditService } from './audit.service';
import { AuditLogQueryDto, UpdateAuditConfigDto } from './dto/audit.dto';

@ApiTags('Admin Audit')
@ApiBearerAuth()
@Controller('admin/audit-logs')
@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
@Permissions(PERMISSIONS.AUDIT_READ)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('settings')
  getConfig() {
    return this.audit.getConfig();
  }

  @Patch('settings')
  updateConfig(
    @Body() dto: UpdateAuditConfigDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.audit.updateConfig(dto.enabled, actor?.userId);
  }

  @Get()
  getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.audit.getAuditLogs(query);
  }
}
