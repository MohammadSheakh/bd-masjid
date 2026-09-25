import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from '@app/database';
import { AuthModule } from './features/authentication/auth.module';
import { UserModule } from './features/user-management/user.module';
import { AuditModule } from './features/audit/audit.module';
import { OperationsHealthModule } from './features/operations-health/operations-health.module';
import { SettingsModule } from './features/settings/settings.module';
import { MosquesModule } from './features/mosques/mosques.module';
import { PrayerSchedulesModule } from './features/prayer-schedules/prayer-schedules.module';
import { AttendanceModule } from './features/attendance/attendance.module';
import { SuggestionsModule } from './features/suggestions/suggestions.module';
import { MosqueVerificationModule } from './features/mosque-verification/mosque-verification.module';
import { CommunityModule } from './features/community/community.module';

/**
 * Application Root Module - Mosque Information & Community Platform
 */
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    OperationsHealthModule,
    AuthModule,
    UserModule,
    AuditModule,
    SettingsModule,
    MosquesModule,
    PrayerSchedulesModule,
    AttendanceModule,
    SuggestionsModule,
    MosqueVerificationModule,
    CommunityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
