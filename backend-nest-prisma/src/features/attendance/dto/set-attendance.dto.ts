import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class SetAttendanceDto {
  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.REGULAR,
    description: 'Attendance frequency at this mosque (REGULAR or OCCASIONAL)',
  })
  @IsNotEmpty()
  @IsEnum(AttendanceStatus, {
    message: 'status must be either REGULAR or OCCASIONAL',
  })
  status: AttendanceStatus;
}
