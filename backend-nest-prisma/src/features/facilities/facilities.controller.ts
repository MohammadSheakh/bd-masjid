import {
  Controller,
  Get,
  Put,
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
import { FacilitiesService } from './facilities.service';
import { UpsertFacilityDto } from './dto/upsert-facility.dto';

@ApiTags('Mosque Facilities & Capacity')
@Controller('mosques/:id/facilities')
@UseGuards(AuthGuard, SlidingWindowRateLimitGuard)
@UseInterceptors(TransformResponseInterceptor)
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get()
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'Get mosque facilities and amenities',
    description:
      'Public endpoint returning detailed facilities taxonomy, capacity, and accessibility',
  })
  @ApiParam({ name: 'id', description: 'Mosque ID' })
  @ApiResponse({
    status: 200,
    description: 'Mosque facilities retrieved or null if not yet reported',
  })
  @ApiResponse({ status: 404, description: 'Mosque not found' })
  async getFacilities(@Param('id') mosqueId: string) {
    return this.facilitiesService.getFacilities(mosqueId);
  }

  @Put()
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 20 })
  @ApiOperation({
    summary: 'Upsert mosque facilities taxonomy',
    description:
      'Authorized endpoint allowing verified mosque administrators or platform admins to update facility details',
  })
  @ApiParam({ name: 'id', description: 'Mosque ID' })
  @ApiResponse({
    status: 200,
    description: 'Mosque facilities updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed on input parameters',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden: actor is not a verified administrator for this mosque',
  })
  @ApiResponse({ status: 404, description: 'Mosque not found' })
  async upsertFacilities(
    @Param('id') mosqueId: string,
    @Body() dto: UpsertFacilityDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.facilitiesService.upsertFacilities(mosqueId, dto, actor);
  }
}
