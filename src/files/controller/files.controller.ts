import { jwtExtractorFromCookies } from './../../common/utils/jwtExtractorFromCookies';
import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { FilesService } from '../service/files.service';
import { PermissionGuard } from 'src/common/guard/permission.guard';

@Controller()
export class FilesController {
  constructor(private readonly fileService: FilesService) {}

  @Get('favicon.ico')
  favicon(): void {
    return;
  }

  @UseGuards(PermissionGuard)
  @Put('*')
  mkdir(@Req() req: Request, @Res() res: Response) {
    this.fileService.mkdir(req.path);
    return res.json({ success: true });
  }

  @UseGuards(PermissionGuard)
  @Delete('*')
  rmdir(
    @Req() req: Request,
    @Res() res: Response,
    @Query('type') type?: string,
  ) {
    if (type === 'file') {
      this.fileService.deleteFile(req.path);
    } else {
      this.fileService.rmdir(req.path);
    }
    return res.json({ success: true });
  }

  @UseGuards(PermissionGuard)
  @Post('*')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined,
      limits: {
        fileSize:
          parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? '512', 10) * 1024 * 1024,
      },
    }),
  )
  uploadFile(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.fileService.uploadFile(req.path, file);
    return res.json({ success: true });
  }

  @Get('*')
  async getFiles(@Req() req: Request, @Res() res: Response) {
    const uri = req.originalUrl;
    const files = this.fileService.listFiles(uri);

    if (typeof files === 'string') {
      if (this.fileService.shouldShowInBrowser(files)) {
        return res.sendFile(files);
      }
      return res.download(files);
    }

    const jwt = jwtExtractorFromCookies(req);
    const user = req.user as { permission?: string } | undefined;
    const permissionRaw = user?.permission ?? '';
    const requestPath = req.path;

    const canUpload =
      !!jwt && this.fileService.canWrite(permissionRaw, requestPath);
    const canDeleteDir =
      !!jwt && this.fileService.canDelete(permissionRaw, requestPath);

    return res.render('index', {
      file_list: files,
      logined: !!jwt,
      canUpload,
      canDeleteDir,
    });
  }
}
