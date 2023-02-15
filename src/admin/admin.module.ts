import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { AdminController } from './controller/admin.controller';

@Module({
  imports: [UsersModule],
  controllers: [AdminController],
})
export class AdminModule {}
