import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class VerifyMosqueDto {
  @ApiPropertyOptional({
    description: 'Verification notes (e.g. proof verified via local contact)',
    example: 'Verified with local committee secretary.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class RejectMosqueDto {
  @ApiProperty({
    description: 'Mandatory reason for rejection',
    example: 'Duplicate entry of already verified mosque 20 meters away.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string;
}
