import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import {
  DonationChannelStatus,
  DonationChannelType,
  DonationPurpose,
} from '@prisma/client';

export class QueryDonationsDto {
  @ApiPropertyOptional({
    enum: DonationChannelStatus,
    description: 'Filter by channel status (Staff can view PENDING_VERIFICATION)',
  })
  @IsOptional()
  @IsEnum(DonationChannelStatus)
  status?: DonationChannelStatus;

  @ApiPropertyOptional({
    enum: DonationChannelType,
    description: 'Filter by channel type (BKASH, NAGAD, etc.)',
  })
  @IsOptional()
  @IsEnum(DonationChannelType)
  channelType?: DonationChannelType;

  @ApiPropertyOptional({
    enum: DonationPurpose,
    description: 'Filter by fund purpose (GENERAL_FUND, CONSTRUCTION_EXPANSION, etc.)',
  })
  @IsOptional()
  @IsEnum(DonationPurpose)
  purpose?: DonationPurpose;
}
