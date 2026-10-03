import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MosqueStaffRole } from '@prisma/client';

export class UpdateStaffDto {
  @ApiPropertyOptional({
    enum: MosqueStaffRole,
    description: 'Role of the staff member at the mosque',
    example: MosqueStaffRole.IMAM,
  })
  @IsEnum(MosqueStaffRole)
  @IsOptional()
  role?: MosqueStaffRole;

  @ApiPropertyOptional({
    description: 'Full name of the staff member',
    example: 'Maulana Mufti Abdullah',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Custom role title if role is CUSTOM',
    example: 'Treasurer & Accounts In-Charge',
  })
  @IsString()
  @IsOptional()
  customRoleTitle?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+8801711223344',
  })
  @IsString()
  @IsOptional()
  contactNumber?: string;

  @ApiPropertyOptional({
    description: 'Starting date of service at this mosque',
    example: '2023-01-15T00:00:00.000Z',
  })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Photo / avatar image URL of the staff member',
    example: 'https://example.com/staff/photo.jpg',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the staff member is officially verified',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}
