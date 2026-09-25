import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  RolesGuard,
  Roles,
  Public,
  User as CurrentUser,
  TransformResponseInterceptor,
  SlidingWindowRateLimitGuard,
  RateLimit,
} from '@app/common';
import type { UserPayload } from '@app/common';
import { RoleClaimStatus } from '@prisma/client';
import { CommunityService } from './community.service';
import { AddStaffDto } from './dto/add-staff.dto';
import { CreateRoleClaimDto } from './dto/create-claim.dto';
import { ReviewRoleClaimDto } from './dto/review-claim.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CreateDonationMethodDto } from './dto/create-donation.dto';
import { ReviewDonationMethodDto } from './dto/review-donation.dto';

@ApiTags('Mosque Community & Roles')
@Controller()
@UseGuards(AuthGuard, RolesGuard, SlidingWindowRateLimitGuard)
@UseInterceptors(TransformResponseInterceptor)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Staff & Committee
  // ──────────────────────────────────────────────────────────────────────────

  @Get('mosques/:id/staff')
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'Get mosque staff and committee directory',
    description:
      'Returns list of verified Imams, Muazzins, and Committee members',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiResponse({ status: 200, description: 'Staff directory' })
  async getStaff(@Param('id') mosqueId: string) {
    return this.communityService.getStaff(mosqueId);
  }

  @Post('mosques/:id/staff')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 30 })
  @ApiOperation({
    summary: 'Add staff or committee member',
    description: 'Directly add a staff/committee member (admin/moderator)',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  async addStaff(
    @Param('id') mosqueId: string,
    @Body() dto: AddStaffDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.communityService.addStaff(mosqueId, dto, actor);
  }

  @Delete('mosques/:id/staff/:staffId')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 30 })
  @ApiOperation({
    summary: 'Remove staff or committee member',
    description: 'Delete a staff/committee entry (admin/moderator)',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiParam({ name: 'staffId', description: 'Staff UUID' })
  async removeStaff(
    @Param('id') mosqueId: string,
    @Param('staffId') staffId: string,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.communityService.removeStaff(mosqueId, staffId, actor);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Role Claims
  // ──────────────────────────────────────────────────────────────────────────

  @Post('mosques/:id/role-claims')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 10 })
  @ApiOperation({
    summary: 'Submit an official role claim for a mosque',
    description:
      'Authenticated users submit appointment evidence to claim an official role',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiResponse({ status: 201, description: 'Role claim submitted' })
  @ApiResponse({
    status: 409,
    description: 'Claim already exists for this role',
  })
  async submitRoleClaim(
    @Param('id') mosqueId: string,
    @Body() dto: CreateRoleClaimDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.communityService.submitRoleClaim(mosqueId, dto, actor);
  }

  @Get('admin/role-claims')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'List role claims for moderation',
    description: 'Query submitted role claims (admin/moderator)',
  })
  @ApiQuery({ name: 'status', enum: RoleClaimStatus, required: false })
  @ApiQuery({ name: 'mosqueId', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getRoleClaims(
    @Query('status') status?: RoleClaimStatus,
    @Query('mosqueId') mosqueId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.communityService.getRoleClaims(
      status,
      mosqueId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Patch('admin/role-claims/:claimId/review')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 30 })
  @ApiOperation({
    summary: 'Approve or reject a role claim',
    description:
      'Approving automatically assigns verified staff status (admin/moderator)',
  })
  @ApiParam({ name: 'claimId', description: 'Claim UUID' })
  async reviewRoleClaim(
    @Param('claimId') claimId: string,
    @Body() dto: ReviewRoleClaimDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.communityService.reviewRoleClaim(claimId, dto, actor);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Announcements
  // ──────────────────────────────────────────────────────────────────────────

  @Get('mosques/:id/announcements')
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'List announcements for a mosque',
    description: 'Public list of official announcements and notices',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  async getAnnouncements(@Param('id') mosqueId: string) {
    return this.communityService.getAnnouncements(mosqueId);
  }

  @Post('mosques/:id/announcements')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 15 })
  @ApiOperation({
    summary: 'Post an official announcement',
    description: 'Allowed for verified mosque staff/committee or admins',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  async createAnnouncement(
    @Param('id') mosqueId: string,
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.communityService.createAnnouncement(mosqueId, dto, actor);
  }

  @Delete('mosques/:id/announcements/:announcementId')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 15 })
  @ApiOperation({
    summary: 'Delete an announcement',
    description: 'Author or admin can delete an announcement',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiParam({ name: 'announcementId', description: 'Announcement UUID' })
  async deleteAnnouncement(
    @Param('id') mosqueId: string,
    @Param('announcementId') announcementId: string,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.communityService.deleteAnnouncement(
      mosqueId,
      announcementId,
      actor,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Verified Mosque Donations (Release 3 / PRD Section 14)
  // ──────────────────────────────────────────────────────────────────────────

  @Get('admin/donations')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'List all donation methods for moderation',
    description: 'Returns all donation methods across mosques for admin review',
  })
  async getAllDonationMethods() {
    return this.communityService.getAllDonationMethods();
  }

  @Get('mosques/:id/donations')
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'List verified donation methods for a mosque',
    description:
      'Returns bKash, Nagad, or Bank channels verified by committee/admin',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  async getDonationMethods(
    @Param('id') mosqueId: string,
    @CurrentUser() actor?: UserPayload,
  ) {
    return this.communityService.getDonationMethods(mosqueId, actor);
  }

  @Post('mosques/:id/donations')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 15 })
  @ApiOperation({
    summary: 'Add verified donation method for a mosque',
    description: 'Authorized for verified staff, committee, or platform admin',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  async addDonationMethod(
    @Param('id') mosqueId: string,
    @Body() dto: CreateDonationMethodDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.communityService.addDonationMethod(mosqueId, dto, actor);
  }

  @Patch('admin/donations/:id/review')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 30 })
  @ApiOperation({
    summary: 'Review and verify/reject a donation method',
    description: 'Admin/moderator approves or un-verifies a donation method',
  })
  @ApiParam({ name: 'id', description: 'Donation Method UUID' })
  async reviewDonationMethod(
    @Param('id') donationMethodId: string,
    @Body() dto: ReviewDonationMethodDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.communityService.reviewDonationMethod(
      donationMethodId,
      dto,
      actor,
    );
  }

  @Delete('mosques/:id/donations/:donationId')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 15 })
  @ApiOperation({
    summary: 'Delete a donation method',
    description: 'Creator or admin can delete a donation channel',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiParam({ name: 'donationId', description: 'Donation Method UUID' })
  async deleteDonationMethod(
    @Param('id') mosqueId: string,
    @Param('donationId') donationId: string,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.communityService.deleteDonationMethod(
      mosqueId,
      donationId,
      actor,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Follow / Bookmark Mosques (Release 3)
  // ──────────────────────────────────────────────────────────────────────────

  @Post('mosques/:id/bookmark')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 30 })
  @ApiOperation({
    summary: 'Toggle follow / bookmark mosque for personal prayer updates',
    description: 'Authenticated user bookmarks or un-bookmarks a mosque',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  async toggleBookmark(
    @Param('id') mosqueId: string,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.communityService.toggleBookmark(mosqueId, actor.userId);
  }

  @Get('users/me/bookmarks')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'Get current user followed / bookmarked mosques',
    description: 'Returns list of mosques bookmarked by the authenticated user',
  })
  async getUserBookmarks(@CurrentUser() actor: UserPayload) {
    return this.communityService.getUserBookmarks(actor.userId);
  }
}
