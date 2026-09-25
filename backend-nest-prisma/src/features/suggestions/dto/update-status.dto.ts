import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { SuggestionStatus } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({
    enum: SuggestionStatus,
    example: SuggestionStatus.RESOLVED,
    description: 'New review status (UNDER_REVIEW, RESOLVED, REJECTED)',
  })
  @IsNotEmpty()
  @IsEnum(SuggestionStatus, {
    message: 'status must be a valid SuggestionStatus (OPEN, UNDER_REVIEW, RESOLVED, REJECTED)',
  })
  status: SuggestionStatus;

  @ApiPropertyOptional({
    description: 'Optional moderator notes or explanation of resolution',
    example: 'Verified with mosque committee over phone and updated timetable.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNotes?: string;
}
