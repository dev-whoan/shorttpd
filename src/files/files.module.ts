import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './controller/files.controller';
import { FilesService } from './service/files.service';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { PermissionGuard } from 'src/common/guard/permission.guard';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, UsersModule],
  controllers: [FilesController],
  providers: [FilesService, PermissionGuard],
})
export class FilesModule {}
