import {
  Controller,
  Get,
  Post,
  Patch,
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
import { SuggestionStatus, ReportType } from '@prisma/client';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('Suggestions & Reports')
@Controller()
@UseGuards(AuthGuard, RolesGuard, SlidingWindowRateLimitGuard)
@UseInterceptors(TransformResponseInterceptor)
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post('mosques/:id/suggestions')
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 15 })
  @ApiOperation({
    summary: 'Submit prayer schedule or info suggestion',
    description:
      'Allows community members to suggest prayer time or profile corrections',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiResponse({
    status: 201,
    description: 'Suggestion submitted successfully',
  })
  async createSuggestion(
    @Param('id') mosqueId: string,
    @Body() dto: CreateSuggestionDto,
    @CurrentUser() user?: UserPayload,
  ) {
    return this.suggestionsService.createSuggestion(
      mosqueId,
      dto,
      user?.userId,
    );
  }

  @Post('mosques/:id/reports')
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 10 })
  @ApiOperation({
    summary: 'Report an issue or incorrect data',
    description:
      'Report incorrect prayer times, wrong location, closed mosque, or duplicate listing',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiResponse({ status: 201, description: 'Report submitted successfully' })
  async createReport(
    @Param('id') mosqueId: string,
    @Body() dto: CreateReportDto,
    @CurrentUser() user?: UserPayload,
  ) {
    return this.suggestionsService.createReport(mosqueId, dto, user?.userId);
  }

  // --- Moderation Endpoints ---

  @Get('admin/suggestions')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'List suggestions for moderation',
    description:
      'Retrieve pending or reviewed community suggestions (moderator/admin)',
  })
  @ApiQuery({ name: 'status', enum: SuggestionStatus, required: false })
  @ApiQuery({ name: 'mosqueId', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getSuggestions(
    @Query('status') status?: SuggestionStatus,
    @Query('mosqueId') mosqueId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.suggestionsService.getSuggestions(
      status,
      mosqueId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Patch('admin/suggestions/:id/status')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 30 })
  @ApiOperation({
    summary: 'Update suggestion status',
    description: 'Resolve, review, or reject a community suggestion with notes',
  })
  @ApiParam({ name: 'id', description: 'Suggestion UUID' })
  async updateSuggestionStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.suggestionsService.updateSuggestionStatus(id, dto, actor);
  }

  @Get('admin/reports')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'List reports for moderation',
    description:
      'Retrieve issue reports with type and status filtering (moderator/admin)',
  })
  @ApiQuery({ name: 'status', enum: SuggestionStatus, required: false })
  @ApiQuery({ name: 'type', enum: ReportType, required: false })
  @ApiQuery({ name: 'mosqueId', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getReports(
    @Query('status') status?: SuggestionStatus,
    @Query('type') type?: ReportType,
    @Query('mosqueId') mosqueId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.suggestionsService.getReports(
      status,
      type,
      mosqueId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Patch('admin/reports/:id/status')
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 30 })
  @ApiOperation({
    summary: 'Update report status',
    description: 'Resolve, review, or dismiss a report with notes',
  })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  async updateReportStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.suggestionsService.updateReportStatus(id, dto, actor);
  }
}
