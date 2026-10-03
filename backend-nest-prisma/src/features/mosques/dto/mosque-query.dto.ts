import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
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

const parseQueryBoolean = ({ value }: { value: any }) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};

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
    description:
      'Filter by public listing status (true for listed, false for unlisted)',
    example: true,
  })
  @IsOptional()
  @Transform(parseQueryBoolean)
  @IsBoolean()
  isListed?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'Dhaka',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by women prayer space availability',
  })
  @IsOptional()
  @Transform(parseQueryBoolean)
  hasSeparateWomenSpace?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by air conditioning availability',
  })
  @IsOptional()
  @Transform(parseQueryBoolean)
  hasAirConditioning?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by parking availability',
  })
  @IsOptional()
  @Transform(parseQueryBoolean)
  hasParking?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by wheelchair accessibility',
  })
  @IsOptional()
  @Transform(parseQueryBoolean)
  hasWheelchairAccess?: boolean;

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
