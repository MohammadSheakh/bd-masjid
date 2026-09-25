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
  HttpStatus,
  HttpCode,
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
import { MosquesService } from './mosques.service';
import { CreateMosqueDto } from './dto/create-mosque.dto';
import { UpdateMosqueDto } from './dto/update-mosque.dto';
import { NearbyMosquesQueryDto } from './dto/nearby-mosques.dto';
import { MosqueQueryDto } from './dto/mosque-query.dto';

@ApiTags('Mosques')
@Controller('mosques')
@UseGuards(AuthGuard, SlidingWindowRateLimitGuard)
@UseInterceptors(TransformResponseInterceptor)
export class MosquesController {
  constructor(private readonly mosquesService: MosquesService) {}

  @Post()
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 15 })
  @ApiOperation({
    summary: 'Submit a new mosque',
    description:
      'Pin-drop mosque creation with spatial proximity duplicate detection',
  })
  @ApiResponse({ status: 201, description: 'Mosque submitted successfully' })
  @ApiResponse({
    status: 409,
    description: 'Possible duplicate detected within 50m',
  })
  async create(
    @Body() dto: CreateMosqueDto,
    @CurrentUser() actor?: UserPayload,
  ) {
    return this.mosquesService.create(dto, actor);
  }

  @Get('nearby')
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'Find nearby mosques',
    description: 'Spherical spatial distance query bounded by radius and limit',
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby mosques list with distance in meters',
  })
  async findNearby(@Query() query: NearbyMosquesQueryDto) {
    return this.mosquesService.findNearby(query);
  }

  @Post('check-duplicate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @RateLimit({ windowMs: 60 * 1000, max: 30 })
  @ApiOperation({
    summary: 'Check for duplicate candidates',
    description:
      'Pre-flight check returning existing mosques within 50m of coordinates',
  })
  @ApiResponse({
    status: 200,
    description: 'List of candidate duplicate mosques',
  })
  async checkDuplicate(
    @Body() coords: { latitude: number; longitude: number },
  ) {
    const candidates = await this.mosquesService.findDuplicateCandidates(
      coords.latitude,
      coords.longitude,
    );
    return { candidates };
  }

  @Get(':id')
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 120 })
  @ApiOperation({
    summary: 'Get mosque by ID',
    description:
      'Returns profile, current prayer timetable, freshness, and attendance summary',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiResponse({ status: 200, description: 'Mosque profile' })
  @ApiResponse({ status: 404, description: 'Mosque not found' })
  async findById(@Param('id') id: string, @CurrentUser() user?: UserPayload) {
    return this.mosquesService.findById(id, user?.userId);
  }

  @Get()
  @Public()
  @RateLimit({ windowMs: 60 * 1000, max: 60 })
  @ApiOperation({
    summary: 'Search and filter mosques',
    description:
      'Paginated search with text query and operational/verification filters',
  })
  @ApiResponse({ status: 200, description: 'Paginated mosque list' })
  async findAll(@Query() query: MosqueQueryDto) {
    return this.mosquesService.findAll(query);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @RateLimit({ windowMs: 60 * 1000, max: 20 })
  @ApiOperation({
    summary: 'Update mosque details',
    description: 'Update mosque metadata (authenticated)',
  })
  @ApiParam({ name: 'id', description: 'Mosque UUID' })
  @ApiResponse({ status: 200, description: 'Mosque updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Mosque not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMosqueDto,
    @CurrentUser() actor: UserPayload,
  ) {
    return this.mosquesService.update(id, dto, actor);
  }
}
