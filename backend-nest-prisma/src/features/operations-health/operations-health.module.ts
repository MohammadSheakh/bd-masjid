import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/database';
import { AuthModule } from '../authentication/auth.module';
import { OperationsHealthController } from './operations-health.controller';
import { OperationsHealthService } from './operations-health.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OperationsHealthController],
  providers: [OperationsHealthService],
  exports: [OperationsHealthService],
})
export class OperationsHealthModule {}
