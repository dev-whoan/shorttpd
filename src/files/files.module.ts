import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './controller/files.controller';
import { FilesService } from './service/files.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
