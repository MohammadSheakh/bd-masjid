import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_MESSAGE = 'Time must be in 24-hour HH:mm format (e.g., "05:15", "13:30")';

export class UpdatePrayerScheduleDto {
  @ApiPropertyOptional({ example: '04:45', description: 'Fajr start time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  fajrStart?: string;

  @ApiPropertyOptional({ example: '05:15', description: 'Fajr Jamaat time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  fajrJamaat?: string;

  @ApiPropertyOptional({ example: '06:05', description: 'Sunrise time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  sunrise?: string;

  @ApiPropertyOptional({ example: '12:05', description: 'Zuhr start time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  zuhrStart?: string;

  @ApiPropertyOptional({ example: '13:30', description: 'Zuhr Jamaat time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  zuhrJamaat?: string;

  @ApiPropertyOptional({ example: '16:15', description: 'Asr start time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  asrStart?: string;

  @ApiPropertyOptional({ example: '16:45', description: 'Asr Jamaat time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  asrJamaat?: string;

  @ApiPropertyOptional({ example: '18:10', description: 'Maghrib start time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  maghribStart?: string;

  @ApiPropertyOptional({ example: '18:15', description: 'Maghrib Jamaat time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  maghribJamaat?: string;

  @ApiPropertyOptional({ example: '19:30', description: 'Isha start time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  ishaStart?: string;

  @ApiPropertyOptional({ example: '20:00', description: 'Isha Jamaat time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  ishaJamaat?: string;

  @ApiPropertyOptional({ example: '13:30', description: 'Jumuah Jamaat time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: TIME_MESSAGE })
  jumuahJamaat?: string;

  @ApiPropertyOptional({ example: 'Asia/Dhaka', default: 'Asia/Dhaka' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'Winter schedule transition', description: 'Reason for schedule change' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
