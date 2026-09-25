import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  MosqueOperationalStatus,
  MosqueVerificationStatus,
} from '@prisma/client';
import { MOSQUE_CONSTANTS } from '../mosques.constants';

export class MosqueQueryDto {
  @ApiPropertyOptional({
    description: 'Search mosques by name or address',
    example: 'Baitul',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: MosqueOperationalStatus,
    description: 'Filter by operational status',
  })
  @IsOptional()
  @IsEnum(MosqueOperationalStatus)
  operationalStatus?: MosqueOperationalStatus;

  @ApiPropertyOptional({
    enum: MosqueVerificationStatus,
    description: 'Filter by verification status',
  })
  @IsOptional()
  @IsEnum(MosqueVerificationStatus)
  verificationStatus?: MosqueVerificationStatus;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'Dhaka',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: `Items per page (max ${MOSQUE_CONSTANTS.MAX_LIMIT})`,
    default: MOSQUE_CONSTANTS.DEFAULT_LIMIT,
    maximum: MOSQUE_CONSTANTS.MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(MOSQUE_CONSTANTS.MAX_LIMIT)
  limit?: number = MOSQUE_CONSTANTS.DEFAULT_LIMIT;
}
