import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { AnnouncementCategory } from '@prisma/client';

export class FeedAnnouncementsDto {
  @ApiPropertyOptional({
    example: 23.8103,
    description: 'Latitude for nearby spatial feed query',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({
    example: 90.4125,
    description: 'Longitude for nearby spatial feed query',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({
    example: 5.0,
    default: 5.0,
    description: 'Spatial search radius in kilometers (max 25km)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(25)
  radiusKm?: number = 5.0;

  @ApiPropertyOptional({
    enum: AnnouncementCategory,
    description: 'Filter announcements by category',
  })
  @IsOptional()
  @IsEnum(AnnouncementCategory)
  category?: AnnouncementCategory;

  @ApiPropertyOptional({
    example: false,
    description: 'Filter strictly for urgent emergency alerts',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  emergencyOnly?: boolean = false;

  @ApiPropertyOptional({
    example: false,
    description: "Filter only announcements from user's bookmarked mosques",
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  bookmarkedOnly?: boolean = false;

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
