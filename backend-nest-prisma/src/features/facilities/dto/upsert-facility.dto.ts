import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
  Min,
} from 'class-validator';

export class UpsertFacilityDto {
  @ApiPropertyOptional({
    example: 1200,
    description: 'Total prayer musalli capacity',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalCapacity?: number;

  @ApiPropertyOptional({
    example: 8,
    description: 'Total number of toilets/washrooms',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  toiletCount?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether there is a dedicated/separate wudu area',
  })
  @IsOptional()
  @IsBoolean()
  hasSeparateWudu?: boolean;

  @ApiPropertyOptional({
    example: 40,
    description: 'Wudu faucet/tap capacity',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  wuduCapacity?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether dedicated secluded female prayer space exists',
  })
  @IsOptional()
  @IsBoolean()
  hasFemalePrayerSpace?: boolean;

  @ApiPropertyOptional({
    example: 150,
    description: 'Capacity of female prayer section',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  femaleCapacity?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether wheelchair accessibility/entry is available',
  })
  @IsOptional()
  @IsBoolean()
  hasWheelchairAccess?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether wheelchair access ramp is available',
  })
  @IsOptional()
  @IsBoolean()
  hasRamp?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether air conditioning is present',
  })
  @IsOptional()
  @IsBoolean()
  hasAirConditioning?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether electric fans are present',
  })
  @IsOptional()
  @IsBoolean()
  hasFan?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether Janaza staging/washing service is available',
  })
  @IsOptional()
  @IsBoolean()
  hasJanazaService?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether car parking is available',
  })
  @IsOptional()
  @IsBoolean()
  hasParkingCar?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether motorcycle/bicycle parking is available',
  })
  @IsOptional()
  @IsBoolean()
  hasParkingBike?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether a Maktab or Islamic library is available',
  })
  @IsOptional()
  @IsBoolean()
  hasLibraryMaktab?: boolean;

  @ApiPropertyOptional({
    example: ['Elevator / Lift', 'Solar Power / IPS', 'CCTV Surveillance'],
    description: 'Extensible list of custom or additional facility amenities',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(50, { each: true })
  customAmenities?: string[];
}
