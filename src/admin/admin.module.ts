import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { AdminController } from './controller/admin.controller';
import { AdminSeedService } from './admin.seed';

@Module({
  imports: [ConfigModule, UsersModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminSeedService],
})
export class AdminModule {}
