import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { AdminController } from './controller/admin.controller';
import { AdminService } from './service/admin.service';

@Module({
  imports: [UsersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
