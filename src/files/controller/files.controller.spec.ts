import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from '../service/files.service';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/service/users.service';
import { Request, Response } from 'express';

// __analysis.md — FilesController

describe('FilesController', () => {
  let controller: FilesController;
  let filesService: jest.Mocked<FilesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: {
            listFiles: jest.fn(),
            shouldShowInBrowser: jest.fn(),
            uploadFile: jest.fn(),
            mkdir: jest.fn(),
            rmdir: jest.fn(),
          },
        },
        {
          provide: PermissionGuard,
          useValue: { canActivate: jest.fn().mockResolvedValue(true) },
        },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('secret') },
        },
        { provide: UsersService, useValue: { findByUsername: jest.fn() } },
      ],
    }).compile();

    controller = module.get(FilesController);
    filesService = module.get(FilesService);
  });

  describe('getFiles', () => {
    it('디렉토리이면 file_list를 index 뷰로 렌더링한다', async () => {
      const entries = [{ name: 'file.txt', dir: false, size: '1 KB', lastModified: null }];
      filesService.listFiles.mockReturnValue(entries);

      const req = { originalUrl: '/', path: '/', cookies: {} } as unknown as Request;
      const res = { render: jest.fn(), sendFile: jest.fn(), download: jest.fn() } as unknown as Response;

      await controller.getFiles(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'index',
        expect.objectContaining({ file_list: entries }),
      );
    });

    it('WEB_VIEW_EXTENSION에 해당하면 sendFile로 응답한다', async () => {
      filesService.listFiles.mockReturnValue('/serve/docs/report.pdf');
      filesService.shouldShowInBrowser.mockReturnValue(true);

      const req = { originalUrl: '/docs/report.pdf', path: '/docs/report.pdf', cookies: {} } as unknown as Request;
      const res = { render: jest.fn(), sendFile: jest.fn(), download: jest.fn() } as unknown as Response;

      await controller.getFiles(req, res);

      expect(res.sendFile).toHaveBeenCalledWith('/serve/docs/report.pdf');
    });

    it('WEB_VIEW_EXTENSION에 없으면 download로 응답한다', async () => {
      filesService.listFiles.mockReturnValue('/serve/docs/archive.zip');
      filesService.shouldShowInBrowser.mockReturnValue(false);

      const req = { originalUrl: '/docs/archive.zip', path: '/docs/archive.zip', cookies: {} } as unknown as Request;
      const res = { render: jest.fn(), sendFile: jest.fn(), download: jest.fn() } as unknown as Response;

      await controller.getFiles(req, res);

      expect(res.download).toHaveBeenCalledWith('/serve/docs/archive.zip');
    });
  });

  describe('uploadFile', () => {
    it('파일 업로드를 FilesService에 위임하고 success를 반환한다', () => {
      filesService.uploadFile.mockReturnValue(undefined);
      const file = { originalname: 'test.txt', buffer: Buffer.from('') } as Express.Multer.File;
      const req = { path: '/uploads' } as unknown as Request;
      const res = { json: jest.fn() } as unknown as Response;

      controller.uploadFile(req, res, file);

      expect(filesService.uploadFile).toHaveBeenCalledWith('/uploads', file);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('mkdir', () => {
    it('디렉토리 생성을 FilesService에 위임하고 success를 반환한다', () => {
      filesService.mkdir.mockReturnValue(undefined);
      const req = { path: '/newdir' } as unknown as Request;
      const res = { json: jest.fn() } as unknown as Response;

      controller.mkdir(req, res);

      expect(filesService.mkdir).toHaveBeenCalledWith('/newdir');
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('rmdir', () => {
    it('디렉토리 삭제를 FilesService에 위임하고 success를 반환한다', () => {
      filesService.rmdir.mockReturnValue(undefined);
      const req = { path: '/emptydir' } as unknown as Request;
      const res = { json: jest.fn() } as unknown as Response;

      controller.rmdir(req, res);

      expect(filesService.rmdir).toHaveBeenCalledWith('/emptydir');
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
});
