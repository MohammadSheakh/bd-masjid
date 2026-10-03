import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AnnouncementCategory } from '@prisma/client';

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({
    example: "Updated: Jumu'ah Khutbah Timing Adjustment",
    description: 'Updated title of the announcement',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated details regarding speech and Jamaat prayer schedules.',
    description: 'Updated announcement content',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  content?: string;

  @ApiPropertyOptional({
    enum: AnnouncementCategory,
    description: 'Updated category taxonomy',
  })
  @IsOptional()
  @IsEnum(AnnouncementCategory)
  category?: AnnouncementCategory;

  @ApiPropertyOptional({
    example: true,
    description: 'Updated pinned status',
  })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({
    example: '2026-10-04T18:00:00.000Z',
    description: 'Updated expiration timestamp in ISO 8601 format',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;
}
