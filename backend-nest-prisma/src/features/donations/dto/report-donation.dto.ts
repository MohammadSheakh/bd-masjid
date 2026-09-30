import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ReportDonationDto {
  @ApiProperty({
    example: 'SUSPECTED_FRAUD',
    description: 'Category of fraud or report reason (INCORRECT_NUMBER, SUSPECTED_FRAUD, UNAUTHORIZED_ACCOUNT, OTHER)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  reason!: string;

  @ApiProperty({
    example: 'This number belongs to an individual seller and is not affiliated with the mosque committee.',
    description: 'Detailed description of why this donation account is suspicious',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  description!: string;
}
