import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectDonationChannelDto {
  @ApiProperty({
    example:
      'Account title does not match mosque official registration documents.',
    description: 'Mandatory reason for rejection or archival',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  reason!: string;
}
