import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { FileEntry, directoryReader } from 'src/common/utils/fileManager';
import {
  parsePermissions,
  resolveAccess,
  canWrite,
  canDelete,
} from 'src/common/permission/permission.types';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly serveRoot: string;
  private readonly webViewExclude: string[];
  private readonly webViewExtensions: string[];

  constructor(private readonly configService: ConfigService) {
    this.serveRoot = path.join(process.env.PWD ?? process.cwd(), 'serve');
    this.webViewExclude = this.configService
      .get<string>('WEB_VIEW_EXCLUDE', '')
      .split(',')
      .filter(Boolean);
    this.webViewExtensions = this.configService
      .get<string>('WEB_VIEW_EXTENSION', '')
      .split(',')
      .filter(Boolean);
  }

  listFiles(uri: string): string | FileEntry[] {
    const decodedUri = decodeURIComponent(uri);
    const targetPath =
      decodedUri === '/'
        ? this.serveRoot
        : path.join(this.serveRoot, decodedUri);

    if (
      targetPath !== this.serveRoot &&
      !targetPath.startsWith(this.serveRoot + path.sep)
    ) {
      throw new HttpException('No Such File', 404);
    }

    this.logger.log(`Serving: ${targetPath}`);

    try {
      const stat = fs.lstatSync(targetPath);

      if (stat.isDirectory()) {
        return directoryReader(targetPath, this.webViewExclude);
      }

      if (this.webViewExclude.includes(path.basename(targetPath))) {
        throw new HttpException('No Such File', 404);
      }

      return targetPath;
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException('No Such File', 404);
    }
  }

  shouldShowInBrowser(file: string): boolean {
    const ext = path.extname(file).replace('.', '');
    return this.webViewExtensions.includes(ext);
  }

  uploadFile(uri: string, file: Express.Multer.File): void {
    const decodedUri = decodeURIComponent(uri);
    const targetDir =
      decodedUri === '/'
        ? this.serveRoot
        : path.join(this.serveRoot, decodedUri);

    if (
      targetDir !== this.serveRoot &&
      !targetDir.startsWith(this.serveRoot + path.sep)
    ) {
      throw new HttpException('잘못된 경로입니다.', 400);
    }

    if (!fs.existsSync(targetDir)) {
      throw new HttpException('디렉토리가 존재하지 않습니다.', 404);
    }

    if (!fs.lstatSync(targetDir).isDirectory()) {
      throw new HttpException('업로드 대상이 디렉토리가 아닙니다.', 400);
    }

    fs.writeFileSync(path.join(targetDir, file.originalname), file.buffer);
    this.logger.log(`Uploaded: ${path.join(targetDir, file.originalname)}`);
  }

  mkdir(uri: string): void {
    const targetDir = path.join(this.serveRoot, decodeURIComponent(uri));

    if (!targetDir.startsWith(this.serveRoot + path.sep)) {
      throw new HttpException('잘못된 경로입니다.', 400);
    }

    if (fs.existsSync(targetDir)) {
      throw new HttpException('이미 존재하는 디렉토리입니다.', 409);
    }

    fs.mkdirSync(targetDir);
    this.logger.log(`Created directory: ${targetDir}`);
  }

  rmdir(uri: string): void {
    const targetDir = path.join(this.serveRoot, decodeURIComponent(uri));

    if (!targetDir.startsWith(this.serveRoot + path.sep)) {
      throw new HttpException('잘못된 경로입니다.', 400);
    }

    if (!fs.existsSync(targetDir)) {
      throw new HttpException('디렉토리가 존재하지 않습니다.', 404);
    }

    if (!fs.lstatSync(targetDir).isDirectory()) {
      throw new HttpException('디렉토리가 아닙니다.', 400);
    }

    if (fs.readdirSync(targetDir).length > 0) {
      throw new HttpException('비어있지 않은 디렉토리는 삭제할 수 없습니다.', 400);
    }

    fs.rmdirSync(targetDir);
    this.logger.log(`Deleted directory: ${targetDir}`);
  }

  deleteFile(uri: string): void {
    const targetFile = path.join(this.serveRoot, decodeURIComponent(uri));

    if (!targetFile.startsWith(this.serveRoot + path.sep)) {
      throw new HttpException('잘못된 경로입니다.', 400);
    }

    if (!fs.existsSync(targetFile)) {
      throw new HttpException('파일이 존재하지 않습니다.', 404);
    }

    if (fs.lstatSync(targetFile).isDirectory()) {
      throw new HttpException('파일이 아닙니다.', 400);
    }

    fs.unlinkSync(targetFile);
    this.logger.log(`Deleted file: ${targetFile}`);
  }

  canWrite(permissionRaw: string, requestPath: string): boolean {
    return canWrite(resolveAccess(parsePermissions(permissionRaw), requestPath));
  }

  canDelete(permissionRaw: string, requestPath: string): boolean {
    return canDelete(resolveAccess(parsePermissions(permissionRaw), requestPath));
  }
}
