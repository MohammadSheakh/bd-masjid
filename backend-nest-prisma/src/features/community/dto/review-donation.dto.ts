import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ReviewDonationMethodDto {
  @ApiProperty({
    description: 'Whether to verify the donation method',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isVerified: boolean;
}
