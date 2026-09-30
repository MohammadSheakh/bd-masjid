import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthGuard,
  Public,
  RateLimit,
  SlidingWindowRateLimitGuard,
  TransformResponseInterceptor,
  User as CurrentUser,
} from '@app/common';
import type { UserPayload } from '@app/common';
import { AnnouncementsService } from './announcements.service';
import {
  CreateAnnouncementDto,
  FeedAnnouncementsDto,
  QueryAnnouncementsDto,
  UpdateAnnouncementDto,
} from './dto';

@ApiTags('Mosque Announcements')
@Controller()
@UseGuards(AuthGuard, SlidingWindowRateLimitGuard)
@UseInterceptors(TransformResponseInterceptor)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get('announcements/feed')
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'Discovery feed across nearby or bookmarked mosques',
    description:
      'Returns active announcements within PostGIS spherical radius, bookmarked mosques, or filtered by emergency category',
  })
  @ApiResponse({ status: 200, description: 'List of announcements in the feed' })
  async getFeed(
    @Query() dto: FeedAnnouncementsDto,
    @CurrentUser() user?: UserPayload,
  ) {
    return this.announcementsService.getAnnouncementsFeed(dto, user);
  }

  @Get([
    'mosques/:id/announcements',
    'community/:id/announcements',
    'announcements/mosques/:id',
  ])
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'List official announcements for a specific mosque',
    description:
      'Public timeline of announcements for a mosque, excluding expired notices by default',
  })
  @ApiParam({ name: 'id', description: 'Mosque ID' })
  @ApiResponse({ status: 200, description: 'Mosque announcements list' })
  @ApiResponse({ status: 404, description: 'Mosque not found' })
  async getMosqueAnnouncements(
    @Param('id') mosqueId: string,
    @Query() query: QueryAnnouncementsDto,
    @CurrentUser() user?: UserPayload,
  ) {
    return this.announcementsService.getMosqueAnnouncements(
      mosqueId,
      query,
      user,
    );
  }

  @Post([
    'mosques/:id/announcements',
    'community/:id/announcements',
    'announcements/mosques/:id',
  ])
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 20 })
  @ApiOperation({
    summary: 'Post an official mosque announcement',
    description:
      'Requires verified staff or admin role. EMERGENCY_ALERT requires Mosque Admin or Committee President.',
  })
  @ApiParam({ name: 'id', description: 'Mosque ID' })
  @ApiResponse({ status: 201, description: 'Announcement created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or pin limit exceeded' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Mosque not found' })
  async createAnnouncement(
    @Param('id') mosqueId: string,
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.announcementsService.createAnnouncement(mosqueId, dto, actor);
  }

  @Patch([
    'announcements/:announcementId',
    'mosques/:mosqueId/announcements/:announcementId',
  ])
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 20 })
  @ApiOperation({
    summary: 'Update an existing announcement',
    description:
      'Requires original author, Mosque Admin, Committee President, or platform admin',
  })
  @ApiParam({ name: 'announcementId', description: 'Announcement ID' })
  @ApiResponse({ status: 200, description: 'Announcement updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async updateAnnouncement(
    @Param('announcementId') announcementId: string,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.announcementsService.updateAnnouncement(
      announcementId,
      dto,
      actor,
    );
  }

  @Delete([
    'announcements/:announcementId',
    'mosques/:mosqueId/announcements/:announcementId',
    'community/:mosqueId/announcements/:announcementId',
  ])
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 20 })
  @ApiOperation({
    summary: 'Delete an announcement',
    description:
      'Requires original author, Mosque Admin, Committee President, or platform admin',
  })
  @ApiParam({ name: 'announcementId', description: 'Announcement ID' })
  @ApiResponse({ status: 200, description: 'Announcement deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async deleteAnnouncement(
    @Param('announcementId') announcementId: string,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.announcementsService.deleteAnnouncement(announcementId, actor);
  }
}
