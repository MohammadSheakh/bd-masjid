import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/database';
import { AuthModule } from '../authentication/auth.module';
import { AuditModule } from '../audit/audit.module';
import { MosquesController } from './mosques.controller';
import { MosquesService } from './mosques.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [MosquesController],
  providers: [MosquesService],
  exports: [MosquesService],
})
export class MosquesModule {}
