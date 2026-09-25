import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MosqueStaffRole } from '@prisma/client';

export class AddStaffDto {
  @ApiProperty({
    enum: MosqueStaffRole,
    description: 'Role of the staff member at the mosque',
    example: MosqueStaffRole.IMAM,
  })
  @IsEnum(MosqueStaffRole)
  @IsNotEmpty()
  role: MosqueStaffRole;

  @ApiProperty({
    description: 'Full name of the staff member',
    example: 'Maulana Mufti Abdullah',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Optional registered user ID if linked to an account',
    example: 'clxxx1234',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+8801711223344',
  })
  @IsString()
  @IsOptional()
  contactNumber?: string;
}
