import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class BulkApproveClaimsDto {
  @ApiProperty({
    required: false,
    description:
      'Optional list of specific claim IDs to approve. If omitted or empty, all OPEN role claims will be approved.',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  claimIds?: string[];

  @ApiProperty({
    required: false,
    description: 'Optional resolution notes recorded on the approved claims',
    example: 'Bulk approved by platform administrator',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  resolutionNotes?: string;
}
