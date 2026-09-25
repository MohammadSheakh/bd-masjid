import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleClaimStatus } from '@prisma/client';

export class ReviewRoleClaimDto {
  @ApiProperty({
    enum: RoleClaimStatus,
    description: 'Updated review status for the role claim',
    example: RoleClaimStatus.APPROVED,
  })
  @IsEnum(RoleClaimStatus)
  @IsNotEmpty()
  status: RoleClaimStatus;

  @ApiPropertyOptional({
    description: 'Internal or public resolution notes from the moderator',
    example: 'Verified appointment letter and contacted committee president.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  resolutionNotes?: string;
}
