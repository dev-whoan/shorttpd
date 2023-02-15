import { HttpException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { directoryReader } from 'src/common/utils/fileManager';

@Injectable()
export class FilesService {
  private readonly logger = new Logger('FileService');
  constructor() {}

  async listFiles(uri: string): Promise<string | string[]> {
    const currentPath = path.join(process.env.PWD, 'serve');
    const webViewExclude = process.env.WEB_VIEW_EXCLUDE
      ? process.env.WEB_VIEW_EXCLUDE.split(',')
      : [];
    let targeturl = decodeURI(uri);

    // 디코딩 후, 기존과 다르면 encode 된 것임
    if (targeturl === uri) {
      targeturl = uri;
    }

    targeturl = targeturl.split(/\ /).join(' ');

    const targetPath =
      uri !== '/' ? path.join(currentPath, targeturl) : currentPath;
    const requestPath = targetPath;
    this.logger.log(`Serving: ${requestPath}`);

    try {
      const isDir = fs.lstatSync(requestPath).isDirectory();
      if (isDir) {
        return directoryReader(requestPath, excludes);
      }

      const filename = path.basename(requestPath);

      if (webViewExclude.indexOf(filename) !== -1) {
        throw new HttpException('No Such File', 404);
      }

      return requestPath;
    } catch (e) {
      if (e.message.includes('favicon')) {
        return;
      }
      if (e.message.includes('no such file')) {
        throw new HttpException('No Such File', 404);
      }
    }
    return [];
  }

  isFileShouldShownInWeb(file: string): boolean {
    const webViewExtensions = process.env.WEB_VIEW_EXTENSION
      ? process.env.WEB_VIEW_EXTENSION.split(',')
      : [];
    return webViewExtensions.indexOf(path.extname(file).split('.')[1]) !== -1;
  }
}
