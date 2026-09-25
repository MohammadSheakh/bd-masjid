import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/database';
import { AuthModule } from '../authentication/auth.module';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { UserDevicesController } from './userDevices/userDevices.controller';
import { UserDevicesService } from './userDevices/userDevices.service';

/**
 * User Module - Mosque Platform
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UserController, UserDevicesController],
  providers: [UserService, UserDevicesService],
  exports: [UserService, UserDevicesService],
})
export class UserModule {}
