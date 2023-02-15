import { jwtExtractorFromCookies } from './../../common/utils/jwtExtractorFromCookies';
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { FilesService } from '../service/files.service';
// @Controller(process.env.SHARE_PREFIX_URI)
@Controller()
export class FilesController {
  constructor(private readonly fileService: FilesService) {}

  @Get('favicon.ico')
  favicon() {
    return;
  }

  @Get('*')
  async getFiles(@Req() req: Request, @Res() res: Response) {
    const uri = req.originalUrl;
    const files = await this.fileService.listFiles(uri);
    if (typeof files === 'string') {
      if (this.fileService.isFileShouldShownInWeb(files)) {
        return res.sendFile(files);
      }
      return res.download(files);
    }

    const jwt = jwtExtractorFromCookies(req);
    return res.render('index', { file_list: files, logined: !!jwt });
  }
}
