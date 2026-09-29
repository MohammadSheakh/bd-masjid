import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MosqueStaffRole } from '@prisma/client';

export class CreateRoleClaimDto {
  @ApiProperty({
    enum: MosqueStaffRole,
    description: 'Claimed official role at the mosque',
    example: MosqueStaffRole.IMAM,
  })
  @IsEnum(MosqueStaffRole)
  @IsNotEmpty()
  role: MosqueStaffRole;

  @ApiProperty({
    description:
      'Evidence supporting the claim (e.g. appointment letter, committee confirmation, witness contact)',
    example:
      'Appointed by managing committee resolution on 12 January 2024. Contact president Haji Rafiq: 01711223344.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(15)
  @MaxLength(1000)
  evidence: string;

  @ApiProperty({
    required: false,
    description: 'Optional URL or reference to supporting appointment document or certificate',
    example: 'https://example.com/uploads/appointment.pdf',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  documentUrl?: string;
}
