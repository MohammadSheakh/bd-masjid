import {
  Controller,
  Get,
  Post,
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
  User as CurrentUser,
  TransformResponseInterceptor,
  SlidingWindowRateLimitGuard,
  RateLimit,
} from '@app/common';
import type { UserPayload } from '@app/common';
import { MosqueVerificationService } from './mosque-verification.service';
import { VerifyMosqueDto, RejectMosqueDto } from './dto/verification.dto';

@ApiTags('Admin Verification')
@Controller('admin/mosques')
@UseGuards(AuthGuard, RolesGuard, SlidingWindowRateLimitGuard)
@UseInterceptors(TransformResponseInterceptor)
@ApiBearerAuth()
export class MosqueVerificationController {
  constructor(private readonly verificationService: MosqueVerificationService) {}

  @Get('pending-verification')
  @Roles('admin', 'moderator')
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'List mosques pending verification',
    description: 'Retrieve mosques with UNVERIFIED or DISPUTED status awaiting review',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Pending mosques list' })
  async getPendingMosques(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.verificationService.getPendingMosques(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Post(':id/verify')
  @Roles('admin', 'moderator')
  @RateLimit({ windowMs: 60 * 1000, max: 30 })
  @ApiOperation({
    summary: 'Verify and approve mosque',
    description: 'Marks mosque as VERIFIED with audit record',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiResponse({ status: 200, description: 'Mosque verified' })
  @ApiResponse({ status: 404, description: 'Mosque not found' })
  async verifyMosque(
    @Param('id') id: string,
    @Body() dto: VerifyMosqueDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.verificationService.verifyMosque(id, dto, actor);
  }

  @Post(':id/reject')
  @Roles('admin', 'moderator')
  @RateLimit({ windowMs: 60 * 1000, max: 30 })
  @ApiOperation({
    summary: 'Reject mosque listing',
    description: 'Marks mosque as REJECTED with required reason and audit record',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiResponse({ status: 200, description: 'Mosque rejected' })
  @ApiResponse({ status: 404, description: 'Mosque not found' })
  async rejectMosque(
    @Param('id') id: string,
    @Body() dto: RejectMosqueDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.verificationService.rejectMosque(id, dto, actor);
  }
}
