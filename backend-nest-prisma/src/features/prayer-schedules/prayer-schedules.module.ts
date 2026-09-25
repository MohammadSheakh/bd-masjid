import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/database';
import { AuthModule } from '../authentication/auth.module';
import { AuditModule } from '../audit/audit.module';
import { PrayerSchedulesController } from './prayer-schedules.controller';
import { PrayerSchedulesService } from './prayer-schedules.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [PrayerSchedulesController],
  providers: [PrayerSchedulesService],
  exports: [PrayerSchedulesService],
})
export class PrayerSchedulesModule {}
