import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsObject } from 'class-validator';

export class CreateSuggestionDto {
  @ApiPropertyOptional({
    description: 'Suggested prayer times map, e.g. { fajrJamaat: "05:15", zuhrJamaat: "13:30" }',
    example: { fajrJamaat: '05:15', ishaJamaat: '20:15' },
  })
  @IsOptional()
  @IsObject()
  suggestedTimes?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Detailed description or context for the suggestion',
    example: 'Jamaat time changed for summer season as announced by committee.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
