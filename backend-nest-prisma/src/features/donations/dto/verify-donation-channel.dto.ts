import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyDonationChannelDto {
  @ApiPropertyOptional({
    example: 'Account verified with bank statement provided by Mutawalli.',
    description: 'Optional verification notes recorded in audit trail',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
