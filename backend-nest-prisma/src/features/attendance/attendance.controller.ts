import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  AuthGuard,
  Public,
  User as CurrentUser,
  TransformResponseInterceptor,
  SlidingWindowRateLimitGuard,
  RateLimit,
} from '@app/common';
import type { UserPayload } from '@app/common';
import { AttendanceService } from './attendance.service';
import { SetAttendanceDto } from './dto/set-attendance.dto';

@ApiTags('Attendance')
@Controller()
@UseGuards(AuthGuard, SlidingWindowRateLimitGuard)
@UseInterceptors(TransformResponseInterceptor)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Put('mosques/:id/attendance')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 30 })
  @ApiOperation({
    summary: 'Set attendance status',
    description:
      'Idempotently marks user as REGULAR or OCCASIONAL attendee of the mosque',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiResponse({ status: 200, description: 'Attendance updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Mosque not found' })
  async setAttendance(
    @Param('id') mosqueId: string,
    @Body() dto: SetAttendanceDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.attendanceService.setAttendance(mosqueId, user.userId, dto);
  }

  @Delete('mosques/:id/attendance')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 30 })
  @ApiOperation({
    summary: 'Remove attendance',
    description: 'Clears user attendance affiliation for this mosque',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiResponse({ status: 200, description: 'Attendance cleared successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeAttendance(
    @Param('id') mosqueId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.attendanceService.removeAttendance(mosqueId, user.userId);
  }

  @Get('mosques/:id/attendance-summary')
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'Get mosque attendance summary',
    description:
      'Returns counts of regular/occasional attendees and the current user affiliation',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiResponse({ status: 200, description: 'Attendance summary' })
  async getSummary(
    @Param('id') mosqueId: string,
    @CurrentUser() user?: UserPayload,
  ) {
    return this.attendanceService.getSummary(mosqueId, user?.userId);
  }

  @Get('attendance/my-mosques')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'Get my attended mosques',
    description:
      'Lists all mosques where current user has marked regular or occasional attendance',
  })
  @ApiResponse({ status: 200, description: 'List of attended mosques' })
  async getMyMosques(@CurrentUser() user: UserPayload) {
    return this.attendanceService.getMyMosques(user.userId);
  }
}
