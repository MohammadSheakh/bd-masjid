import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateMosqueDto {
  @ApiProperty({
    example: 'Baitul Mukarram National Mosque',
    description: 'Name of the mosque',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Mosque name must be at least 3 characters' })
  @MaxLength(200, { message: 'Mosque name cannot exceed 200 characters' })
  name: string;

  @ApiProperty({
    example: 23.7297,
    description: 'Latitude coordinate of the mosque (-90 to 90)',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude must be a valid number' })
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    example: 90.4125,
    description: 'Longitude coordinate of the mosque (-180 to 180)',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude must be a valid number' })
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    example: 'Topkhana Road, Paltan',
    description: 'Street address or location description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({
    example: 'Opposite to National Stadium',
    description: 'Prominent nearby landmark',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @ApiPropertyOptional({
    example: 'Dhaka',
    description: 'City/District name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    example: 'Bangladesh',
    description: 'Country name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    description:
      'If true, ignores the proximity duplicate warning and creates the record anyway',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  allowDuplicateWarningBypass?: boolean;

  // Facilities
  @ApiPropertyOptional({ description: 'Has dedicated wudu area', default: true })
  @IsOptional()
  @IsBoolean()
  hasWuduArea?: boolean;

  @ApiPropertyOptional({ description: 'Has separate women prayer space', default: false })
  @IsOptional()
  @IsBoolean()
  hasSeparateWomenSpace?: boolean;

  @ApiPropertyOptional({ description: 'Has air conditioning', default: false })
  @IsOptional()
  @IsBoolean()
  hasAirConditioning?: boolean;

  @ApiPropertyOptional({ description: 'Has parking facilities', default: false })
  @IsOptional()
  @IsBoolean()
  hasParking?: boolean;

  @ApiPropertyOptional({ description: 'Has wheelchair accessible entrance', default: false })
  @IsOptional()
  @IsBoolean()
  hasWheelchairAccess?: boolean;

  @ApiPropertyOptional({ description: 'Has janaza/funeral prayer facility', default: false })
  @IsOptional()
  @IsBoolean()
  hasJanazaFacility?: boolean;

  @ApiPropertyOptional({ description: 'Estimated congregation capacity', example: 1500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  capacity?: number;

  // Optional initial prayer / Jamaat schedule
  @ApiPropertyOptional({
    example: '05:15',
    description: 'Fajr Jamaat time (HH:mm)',
  })
  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'fajrJamaat must be in HH:mm 24-hour format',
  })
  fajrJamaat?: string;

  @ApiPropertyOptional({
    example: '13:15',
    description: 'Zuhr Jamaat time (HH:mm)',
  })
  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'zuhrJamaat must be in HH:mm 24-hour format',
  })
  zuhrJamaat?: string;

  @ApiPropertyOptional({
    example: '16:45',
    description: 'Asr Jamaat time (HH:mm)',
  })
  @IsOptional()
  @Matches(TIME_REGEX, { message: 'asrJamaat must be in HH:mm 24-hour format' })
  asrJamaat?: string;

  @ApiPropertyOptional({
    example: '18:10',
    description: 'Maghrib Jamaat time (HH:mm)',
  })
  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'maghribJamaat must be in HH:mm 24-hour format',
  })
  maghribJamaat?: string;

  @ApiPropertyOptional({
    example: '20:00',
    description: 'Isha Jamaat time (HH:mm)',
  })
  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'ishaJamaat must be in HH:mm 24-hour format',
  })
  ishaJamaat?: string;

  @ApiPropertyOptional({
    example: '13:30',
    description: 'Jumuah Jamaat time (HH:mm)',
  })
  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'jumuahJamaat must be in HH:mm 24-hour format',
  })
  jumuahJamaat?: string;
}
