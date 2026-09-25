import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  AuthGuard,
  User as CurrentUser,
  TransformResponseInterceptor,
  SlidingWindowRateLimitGuard,
  RateLimit,
} from '@app/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { UserPayload } from '@app/common';
import { USER_RATE_LIMITS } from './user.constants';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard, SlidingWindowRateLimitGuard)
@UseInterceptors(TransformResponseInterceptor)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @RateLimit(USER_RATE_LIMITS.PROFILE_ACCESS)
  @ApiOperation({
    summary: 'Get my profile',
    description: 'Get current authenticated user profile with community stats',
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser() user: UserPayload) {
    const userProfile = await this.userService.findById(user.userId);

    if (!userProfile) {
      throw new NotFoundException('User not found');
    }

    const statistics = await this.userService.getUserStatistics(user.userId);

    return {
      ...userProfile,
      statistics,
    };
  }

  @Put('profile')
  @RateLimit(USER_RATE_LIMITS.PROFILE_UPDATE)
  @ApiOperation({
    summary: 'Update my profile',
    description: 'Update current authenticated user profile information',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() user: UserPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.userService.updateProfile(
      user.userId,
      updateProfileDto,
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  @Get('statistics')
  @RateLimit(USER_RATE_LIMITS.PROFILE_ACCESS)
  @ApiOperation({
    summary: 'Get my statistics',
    description: 'Get current user mosque and attendance statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(@CurrentUser() user: UserPayload) {
    return await this.userService.getUserStatistics(user.userId);
  }

  @Get('me')
  @RateLimit(USER_RATE_LIMITS.PROFILE_ACCESS)
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get current authenticated user information',
  })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getCurrentUser(@CurrentUser() user: UserPayload) {
    return await this.userService.findById(user.userId);
  }
}
