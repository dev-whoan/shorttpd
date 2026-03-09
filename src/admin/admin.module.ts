import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { AdminController } from './controller/admin.controller';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
