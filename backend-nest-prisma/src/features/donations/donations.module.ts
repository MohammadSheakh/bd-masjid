import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/database';
import { AuditModule } from '../audit/audit.module';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [DonationsController],
  providers: [DonationsService],
  exports: [DonationsService],
})
export class DonationsModule {}
