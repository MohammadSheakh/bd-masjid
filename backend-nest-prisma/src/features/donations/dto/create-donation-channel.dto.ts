import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  DonationChannelType,
  DonationChannelAccountType,
  DonationPurpose,
} from '@prisma/client';

export class CreateDonationChannelDto {
  @ApiProperty({
    enum: DonationChannelType,
    example: DonationChannelType.BKASH,
    description:
      'Payment channel type (bKash, Nagad, Rocket, Upay, Bank Transfer)',
  })
  @IsEnum(DonationChannelType)
  @IsNotEmpty()
  channelType!: DonationChannelType;

  @ApiPropertyOptional({
    enum: DonationChannelAccountType,
    default: DonationChannelAccountType.PERSONAL,
    description: 'Account classification (Merchant, Personal, Agent)',
  })
  @IsOptional()
  @IsEnum(DonationChannelAccountType)
  accountType?: DonationChannelAccountType =
    DonationChannelAccountType.PERSONAL;

  @ApiPropertyOptional({
    enum: DonationPurpose,
    default: DonationPurpose.GENERAL_FUND,
    description: 'Designated purpose of funds for this channel',
  })
  @IsOptional()
  @IsEnum(DonationPurpose)
  purpose?: DonationPurpose = DonationPurpose.GENERAL_FUND;

  @ApiProperty({
    example: '01711000000',
    description: 'Account number, phone wallet number, or bank account number',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  accountNumber!: string;

  @ApiProperty({
    example: 'Baitul Mukarram Mosque Fund',
    description: 'Beneficiary title or name registered to the account',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  accountTitle!: string;

  @ApiPropertyOptional({
    example: 'Islami Bank Bangladesh PLC',
    description: 'Bank name if channelType is BANK_TRANSFER',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @ApiPropertyOptional({
    example: 'Motijheel Corporate Branch',
    description: 'Branch name if channelType is BANK_TRANSFER',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  branchName?: string;

  @ApiPropertyOptional({
    example: '125271829',
    description: 'Routing number for inter-bank electronic fund transfers',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  routingNumber?: string;

  @ApiPropertyOptional({
    example:
      'Please mention your name or fund purpose in reference if possible.',
    description: 'Payment instructions or reference guidelines for musallis',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  paymentInstructions?: string;

  @ApiPropertyOptional({
    example:
      'https://res.cloudinary.com/masjid/image/upload/v1234/qr-bkash.png',
    description: 'Optional URL for official channel QR code image',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  qrCodeImageUrl?: string;
}
