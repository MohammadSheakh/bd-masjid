import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
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
import { PrayerSchedulesService } from './prayer-schedules.service';
import { UpdatePrayerScheduleDto } from './dto/update-prayer-schedule.dto';

@ApiTags('Prayer Schedules')
@Controller('mosques/:id/prayer-schedule')
@UseGuards(AuthGuard, SlidingWindowRateLimitGuard)
@UseInterceptors(TransformResponseInterceptor)
export class PrayerSchedulesController {
  constructor(private readonly schedulesService: PrayerSchedulesService) {}

  @Get()
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 120 })
  @ApiOperation({
    summary: 'Get current prayer schedule',
    description:
      'Retrieves current active prayer schedule and information freshness level',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiResponse({ status: 200, description: 'Current prayer schedule' })
  @ApiResponse({ status: 404, description: 'Mosque not found' })
  async getCurrent(@Param('id') id: string) {
    return this.schedulesService.getCurrentSchedule(id);
  }

  @Put()
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 20 })
  @ApiOperation({
    summary: 'Update prayer schedule',
    description:
      'Atomically updates timetable, writes immutable history snapshot, and touches freshness',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiResponse({ status: 200, description: 'Updated prayer schedule' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Mosque not found' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdatePrayerScheduleDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.schedulesService.updateSchedule(id, dto, actor);
  }

  @Get('history')
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'Get prayer schedule change history',
    description:
      'Paginated historical snapshots of prayer schedule modifications',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Historical schedule snapshots' })
  @ApiResponse({ status: 404, description: 'Mosque not found' })
  async getHistory(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.schedulesService.getHistory(
      id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
