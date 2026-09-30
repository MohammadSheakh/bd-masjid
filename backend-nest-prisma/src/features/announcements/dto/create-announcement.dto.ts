import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AnnouncementCategory } from '@prisma/client';

export class CreateAnnouncementDto {
  @ApiProperty({
    example: 'Jumu\'ah Khutbah: Preparation for Ramadan & Community Unity',
    description: 'Title of the announcement',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @ApiProperty({
    example:
      'Special guest Khatib Mawlana Abdullah will deliver this Friday\'s sermon. First Azan is at 12:45 PM.',
    description: 'Detailed announcement body',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(4000)
  content!: string;

  @ApiPropertyOptional({
    enum: AnnouncementCategory,
    default: AnnouncementCategory.GENERAL,
    description: 'Announcement category taxonomy',
  })
  @IsOptional()
  @IsEnum(AnnouncementCategory)
  category?: AnnouncementCategory = AnnouncementCategory.GENERAL;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this announcement should be pinned at the top',
  })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean = false;

  @ApiPropertyOptional({
    example: '2026-10-03T18:00:00.000Z',
    description: 'Optional expiration timestamp in ISO 8601 format',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
