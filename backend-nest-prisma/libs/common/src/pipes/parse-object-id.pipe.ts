import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Parse ObjectId Pipe
 * Validates and transforms string to 24-character hexadecimal ObjectId format
 *
 * Usage:
 * @Param('id', ParseObjectIdPipe) id: string
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException('ID is required');
    }

    if (!OBJECT_ID_REGEX.test(value)) {
      throw new BadRequestException(`Invalid ID format: ${value}`);
    }

    return value;
  }
}
