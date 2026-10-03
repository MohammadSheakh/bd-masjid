import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ToggleMosqueListingDto {
  @ApiProperty({
    description:
      'New listing status: true for listed on public map, false for unlisted',
    example: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  isListed: boolean;

  @ApiPropertyOptional({
    description: 'Reason for unlisting or relisting the mosque',
    example:
      'Temporarily delisted following community report of inaccurate location',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reason?: string;
}
