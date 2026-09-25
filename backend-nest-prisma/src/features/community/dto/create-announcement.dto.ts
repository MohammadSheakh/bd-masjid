import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({
    description: 'Title of the announcement',
    example: 'Special Khatam-ul-Quran & Dua on 27th Ramadan',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(150)
  title: string;

  @ApiProperty({
    description: 'Content / details of the announcement',
    example:
      'Congregation for Khatam-ul-Quran will commence at 10:30 PM followed by special munajat led by our Chief Khatib.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    description: 'Pin this announcement at the top of the mosque profile',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;
}
