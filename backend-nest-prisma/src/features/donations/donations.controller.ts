import {
  Body,
  Controller,
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
import { DonationsService } from './donations.service';
import {
  CreateDonationChannelDto,
  QueryDonationsDto,
  RejectDonationChannelDto,
  ReportDonationDto,
  VerifyDonationChannelDto,
} from './dto';

@ApiTags('Mosque Donations')
@Controller()
@UseGuards(AuthGuard, SlidingWindowRateLimitGuard)
@UseInterceptors(TransformResponseInterceptor)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post('mosques/:id/donations')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 20 })
  @ApiOperation({
    summary: 'Submit a new donation channel for a mosque',
    description:
      'Creates a channel in PENDING_VERIFICATION status. Requires verified Mutawalli, Committee, or Admin.',
  })
  @ApiParam({ name: 'id', description: 'Mosque ID' })
  @ApiResponse({ status: 201, description: 'Donation channel draft submitted' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized staff' })
  async submitDonation(
    @Param('id') mosqueId: string,
    @Body() dto: CreateDonationChannelDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.donationsService.submitDonationChannel(mosqueId, dto, user);
  }

  @Get('mosques/:id/donations')
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'List verified donation channels for a mosque',
    description:
      'Publicly returns verified donation channels. Authorized staff can view pending channels.',
  })
  @ApiParam({ name: 'id', description: 'Mosque ID' })
  @ApiResponse({ status: 200, description: 'List of donation channels' })
  async getMosqueDonations(
    @Param('id') mosqueId: string,
    @Query() query: QueryDonationsDto,
    @CurrentUser() user?: UserPayload,
  ) {
    return this.donationsService.getMosqueDonationChannels(
      mosqueId,
      query,
      user,
    );
  }

  @Get('donations/:id')
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'Get single donation channel details and provenance',
    description:
      'Returns channel details including creator and verifier provenance info.',
  })
  @ApiParam({ name: 'id', description: 'Donation Channel ID' })
  @ApiResponse({ status: 200, description: 'Donation channel details' })
  @ApiResponse({ status: 404, description: 'Donation channel not found' })
  async getDonationById(
    @Param('id') id: string,
    @CurrentUser() user?: UserPayload,
  ) {
    return this.donationsService.getDonationChannelById(id, user);
  }

  @Patch('donations/:id/verify')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 20 })
  @ApiOperation({
    summary: 'Approve and verify a donation channel (Two-Person Verification)',
    description:
      'Requires verified Imam or Mosque Admin. Strictly forbids approving own submission (403).',
  })
  @ApiParam({ name: 'id', description: 'Donation Channel ID' })
  @ApiResponse({ status: 200, description: 'Donation channel verified' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - self-approval or unauthorized',
  })
  async verifyDonation(
    @Param('id') id: string,
    @Body() dto: VerifyDonationChannelDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.donationsService.verifyDonationChannel(id, dto, user);
  }

  @Patch('donations/:id/reject')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 20 })
  @ApiOperation({
    summary: 'Reject or archive a donation channel',
    description:
      'Requires submitter, Imam, Committee President, or Mosque Admin.',
  })
  @ApiParam({ name: 'id', description: 'Donation Channel ID' })
  @ApiResponse({
    status: 200,
    description: 'Donation channel rejected/archived',
  })
  async rejectDonation(
    @Param('id') id: string,
    @Body() dto: RejectDonationChannelDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.donationsService.rejectDonationChannel(id, dto, user);
  }

  @Post('donations/:id/report')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 10 })
  @ApiOperation({
    summary: 'Submit a community fraud or error report',
    description:
      'Increments dispute counter and alerts administration without taking down the channel immediately.',
  })
  @ApiParam({ name: 'id', description: 'Donation Channel ID' })
  @ApiResponse({ status: 201, description: 'Report logged successfully' })
  async reportDonation(
    @Param('id') id: string,
    @Body() dto: ReportDonationDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.donationsService.reportDonationChannel(id, dto, user);
  }
}
