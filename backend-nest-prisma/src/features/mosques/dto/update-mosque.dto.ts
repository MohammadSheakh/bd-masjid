import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { MosqueOperationalStatus } from '@prisma/client';

export class UpdateMosqueDto {
  @ApiPropertyOptional({
    example: 'Baitul Mukarram National Mosque',
    description: 'Updated name of the mosque',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    example: 'Topkhana Road, Paltan, Dhaka',
    description: 'Updated address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({
    example: 'Near Paltan Mor',
    description: 'Updated landmark',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @ApiPropertyOptional({
    example: 'Dhaka',
    description: 'City/District',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    enum: MosqueOperationalStatus,
    description: 'Operational status (OPEN, TEMPORARILY_CLOSED, etc.)',
  })
  @IsOptional()
  @IsEnum(MosqueOperationalStatus)
  operationalStatus?: MosqueOperationalStatus;
}
