import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, IsEmail } from 'class-validator';
import { ReportType } from '@prisma/client';

export class CreateReportDto {
  @ApiProperty({
    enum: ReportType,
    example: ReportType.PRAYER_TIME,
    description: 'Category of the report/flag',
  })
  @IsNotEmpty()
  @IsEnum(ReportType, {
    message: 'type must be a valid ReportType (e.g., PRAYER_TIME, LOCATION, CLOSED_MOSQUE, DUPLICATE, OTHER)',
  })
  type: ReportType;

  @ApiProperty({
    description: 'Detailed explanation of the issue or discrepancy',
    example: 'This mosque was temporarily closed for renovation starting last Friday.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({
    description: 'Optional contact email for follow-up verification',
    example: 'contact@example.com',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}
