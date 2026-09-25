import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/database';
import { AuthModule } from '../authentication/auth.module';
import { AuditModule } from '../audit/audit.module';
import { MosqueVerificationController } from './mosque-verification.controller';
import { MosqueVerificationService } from './mosque-verification.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [MosqueVerificationController],
  providers: [MosqueVerificationService],
  exports: [MosqueVerificationService],
})
export class MosqueVerificationModule {}
