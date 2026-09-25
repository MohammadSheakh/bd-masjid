import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DonationMethodType, DonationAccountType } from '@prisma/client';

export class CreateDonationMethodDto {
  @ApiProperty({
    enum: DonationMethodType,
    description: 'Financial channel type',
    example: DonationMethodType.BKASH,
  })
  @IsEnum(DonationMethodType)
  @IsNotEmpty()
  methodType: DonationMethodType;

  @ApiPropertyOptional({
    enum: DonationAccountType,
    description: 'Account type (Merchant or Personal)',
    default: DonationAccountType.MERCHANT,
  })
  @IsOptional()
  @IsEnum(DonationAccountType)
  accountType?: DonationAccountType;

  @ApiProperty({
    description: 'Wallet mobile number or Bank account number',
    example: '01712345678',
  })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiPropertyOptional({
    description: 'Title of the account (e.g. Mosque Welfare Fund)',
    example: 'Baitul Aman Development Committee',
  })
  @IsOptional()
  @IsString()
  accountTitle?: string;

  @ApiPropertyOptional({
    description: 'Bank name if bank account',
    example: 'Islami Bank Bangladesh PLC',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    description: 'Branch name if bank account',
    example: 'Dhanmondi Branch',
  })
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiPropertyOptional({
    description: 'Routing number for electronic fund transfer',
    example: '125271234',
  })
  @IsOptional()
  @IsString()
  routingNumber?: string;

  @ApiPropertyOptional({
    description: 'Payment instructions or counter number notes',
    example: 'Use reference: DONATION or Counter: 01',
  })
  @IsOptional()
  @IsString()
  instructions?: string;
}
