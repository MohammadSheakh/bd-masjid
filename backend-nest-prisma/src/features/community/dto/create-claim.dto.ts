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
    required: false,
    description:
      'Custom role title if role is CUSTOM (e.g. Assistant Imam, Treasurer)',
    example: 'Assistant Imam & Quran Teacher',
  })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  customRoleTitle?: string;

  @ApiProperty({
    description: 'Full name of the person claiming the role',
    example: 'Mawlana Hafiz Ahmed',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Contact phone number of the person claiming the role',
    example: '01712345678',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(25)
  phoneNumber: string;

  @ApiProperty({
    required: false,
    description: 'Starting date of service/appointment at this mosque',
    example: '2023-01-15T00:00:00.000Z',
  })
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    required: false,
    description: 'Personal photo / portrait image URL or data URL of applicant',
    example: 'https://example.com/uploads/hafiz.jpg',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    required: false,
    description:
      'Optional evidence supporting the claim (e.g. appointment letter, committee confirmation, witness contact)',
    example:
      'Appointed by managing committee resolution on 12 January 2024. Contact president Haji Rafiq: 01711223344.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  evidence?: string;

  @ApiProperty({
    required: false,
    description:
      'Optional URL or reference to supporting appointment document or certificate',
    example: 'https://example.com/uploads/appointment.pdf',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  documentUrl?: string;
}
