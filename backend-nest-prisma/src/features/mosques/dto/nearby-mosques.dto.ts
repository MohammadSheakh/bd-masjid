import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { MOSQUE_CONSTANTS } from '../mosques.constants';

export class NearbyMosquesQueryDto {
  @ApiProperty({
    example: 23.8103,
    description: 'Latitude of current center point (-90 to 90)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    example: 90.4125,
    description: 'Longitude of current center point (-180 to 180)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({
    example: 3000,
    description: `Search radius in meters (min ${MOSQUE_CONSTANTS.MIN_NEARBY_RADIUS_METERS}, max ${MOSQUE_CONSTANTS.MAX_NEARBY_RADIUS_METERS})`,
    default: MOSQUE_CONSTANTS.DEFAULT_NEARBY_RADIUS_METERS,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(MOSQUE_CONSTANTS.MIN_NEARBY_RADIUS_METERS)
  @Max(MOSQUE_CONSTANTS.MAX_NEARBY_RADIUS_METERS)
  radiusMeters?: number = MOSQUE_CONSTANTS.DEFAULT_NEARBY_RADIUS_METERS;

  @ApiPropertyOptional({
    example: 20,
    description: `Maximum results to return (max ${MOSQUE_CONSTANTS.MAX_LIMIT})`,
    default: MOSQUE_CONSTANTS.DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(MOSQUE_CONSTANTS.MAX_LIMIT)
  limit?: number = MOSQUE_CONSTANTS.DEFAULT_LIMIT;
}
