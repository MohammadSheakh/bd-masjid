import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
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
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto';

@ApiTags('Notifications & Follows')
@Controller()
@UseInterceptors(TransformResponseInterceptor)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notifications')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated notifications for current user' })
  async getNotifications(
    @CurrentUser() user: UserPayload,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.getUserNotifications(user.userId, query);
  }

  @Get('notifications/unread-count')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get total unread notifications count' })
  async getUnreadCount(@CurrentUser() user: UserPayload) {
    const unreadCount = await this.notificationsService.getUnreadCount(user.userId);
    return { unreadCount };
  }

  @Patch('notifications/:id/read')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.userId, id);
  }

  @Patch('notifications/read-all')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  async markAllAsRead(@CurrentUser() user: UserPayload) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Post('mosques/:id/follow')
  @UseGuards(AuthGuard, SlidingWindowRateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 30 })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a mosque' })
  @ApiParam({ name: 'id', description: 'Mosque ID' })
  async followMosque(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    return this.notificationsService.followMosque(user.userId, id);
  }

  @Delete('mosques/:id/follow')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a mosque' })
  @ApiParam({ name: 'id', description: 'Mosque ID' })
  async unfollowMosque(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    return this.notificationsService.unfollowMosque(user.userId, id);
  }

  @Get('mosques/:id/follow-status')
  @Public()
  @ApiOperation({ summary: 'Get follow status and count for a mosque' })
  @ApiParam({ name: 'id', description: 'Mosque ID' })
  async getFollowStatus(
    @Param('id') id: string,
    @CurrentUser() user?: UserPayload,
  ) {
    return this.notificationsService.getFollowStatus(user?.userId || null, id);
  }

  @Get('mosques/followed')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of mosques followed by current user' })
  async getFollowedMosques(@CurrentUser() user: UserPayload) {
    return this.notificationsService.getFollowedMosques(user.userId);
  }
}
