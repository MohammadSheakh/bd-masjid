import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsObject,
  IsEnum,
  IsArray,
} from 'class-validator';
import {
  SuggestionType,
  SuggestionUrgency,
  SuggestionVisibility,
} from '@prisma/client';

export class CreateSuggestionDto {
  @ApiPropertyOptional({
    enum: SuggestionType,
    description: 'Category or nature of the suggestion or grievance',
    example: SuggestionType.SUGGESTION,
  })
  @IsOptional()
  @IsEnum(SuggestionType)
  type?: SuggestionType;

  @ApiPropertyOptional({
    enum: SuggestionUrgency,
    description: 'Urgency level of the feedback',
    example: SuggestionUrgency.MEDIUM,
  })
  @IsOptional()
  @IsEnum(SuggestionUrgency)
  urgency?: SuggestionUrgency;

  @ApiPropertyOptional({
    enum: SuggestionVisibility,
    description:
      'Visibility level: COMMITTEE_ONLY (private to leadership) or PUBLIC (visible to community)',
    example: SuggestionVisibility.COMMITTEE_ONLY,
  })
  @IsOptional()
  @IsEnum(SuggestionVisibility)
  visibility?: SuggestionVisibility;

  @ApiPropertyOptional({
    description:
      'Array of target roles (e.g. IMAM, KHADEM, COMMITTEE, GENERAL)',
    example: ['IMAM', 'KHADEM'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];

  @ApiPropertyOptional({
    description: 'Optional submitter name',
    example: 'Mohammad',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  submitterName?: string;

  @ApiPropertyOptional({
    description: 'Optional submitter contact phone number',
    example: '+8801700000000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  submitterPhone?: string;

  @ApiPropertyOptional({
    description:
      'Suggested prayer times map, e.g. { fajrJamaat: "05:15", zuhrJamaat: "13:30" }',
    example: { fajrJamaat: '05:15', ishaJamaat: '20:15' },
  })
  @IsOptional()
  @IsObject()
  suggestedTimes?: Record<string, any>;

  @ApiPropertyOptional({
    description:
      'Suggested facility details map including capacities and custom amenities',
    example: {
      hasFemalePrayerSpace: true,
      hasWheelchairAccess: true,
      customAmenities: ['Elevator / Lift'],
    },
  })
  @IsOptional()
  @IsObject()
  suggestedFacilities?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Detailed description or context for the suggestion',
    example: 'Please check the second floor sound system before Friday prayer.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
