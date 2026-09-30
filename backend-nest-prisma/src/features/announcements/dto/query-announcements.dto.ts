import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AnnouncementCategory } from '@prisma/client';

export class QueryAnnouncementsDto {
  @ApiPropertyOptional({
    enum: AnnouncementCategory,
    description: 'Filter announcements by category',
  })
  @IsOptional()
  @IsEnum(AnnouncementCategory)
  category?: AnnouncementCategory;

  @ApiPropertyOptional({
    example: false,
    description: 'Include expired announcements (verified staff or admin only)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeExpired?: boolean = false;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Number of records to return',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Offset for pagination',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
