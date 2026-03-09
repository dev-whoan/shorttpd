import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { FilesService } from './files.service';

jest.mock('fs');
jest.mock('src/common/utils/fileManager', () => ({
  directoryReader: jest.fn(),
}));

import { directoryReader } from 'src/common/utils/fileManager';

const mockFs = fs as jest.Mocked<typeof fs>;
const mockDirReader = directoryReader as jest.Mock;
const SERVE_ROOT = path.join(process.cwd(), 'serve');

// __analysis.md > 도메인 4: Files > FilesService

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, def = '') => {
              if (key === 'WEB_VIEW_EXCLUDE') return '';
              if (key === 'WEB_VIEW_EXTENSION') return 'pdf,txt';
              return def;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(FilesService);
  });

  describe('listFiles', () => {
    it('/ 요청이면 serve 루트 디렉토리를 읽어 FileEntry[]를 반환한다', () => {
      const entries = [{ name: 'file.txt', dir: false, size: '1 KB', lastModified: null }];
      (mockFs.lstatSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
      mockDirReader.mockReturnValue(entries);

      const result = service.listFiles('/');

      expect(mockDirReader).toHaveBeenCalledWith(SERVE_ROOT, []);
      expect(result).toEqual(entries);
    });

    it('하위 경로 디렉토리 요청이면 해당 경로의 FileEntry[]를 반환한다', () => {
      (mockFs.lstatSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
      mockDirReader.mockReturnValue([]);

      service.listFiles('/docs');

      expect(mockDirReader).toHaveBeenCalledWith(
        path.join(SERVE_ROOT, '/docs'),
        [],
      );
    });

    it('파일 요청이면 절대경로 문자열을 반환한다', () => {
      (mockFs.lstatSync as jest.Mock).mockReturnValue({ isDirectory: () => false });

      const result = service.listFiles('/docs/readme.txt');

      expect(typeof result).toBe('string');
      expect(result).toBe(path.join(SERVE_ROOT, '/docs/readme.txt'));
    });

    it('serve 루트를 벗어나는 path traversal은 HTTP 404를 던진다', () => {
      expect(() => service.listFiles('/../etc/passwd')).toThrow(
        new HttpException('No Such File', 404),
      );
    });

    it('존재하지 않는 경로는 HTTP 404를 던진다', () => {
      (mockFs.lstatSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOENT: no such file');
      });

      expect(() => service.listFiles('/notfound')).toThrow(
        new HttpException('No Such File', 404),
      );
    });

    it('URL 인코딩된 경로를 디코딩하여 처리한다', () => {
      (mockFs.lstatSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
      mockDirReader.mockReturnValue([]);

      service.listFiles('/my%20docs');

      expect(mockDirReader).toHaveBeenCalledWith(
        path.join(SERVE_ROOT, '/my docs'),
        [],
      );
    });
  });

  describe('shouldShowInBrowser', () => {
    it('WEB_VIEW_EXTENSION에 포함된 확장자이면 true를 반환한다', () => {
      expect(service.shouldShowInBrowser('/report.pdf')).toBe(true);
      expect(service.shouldShowInBrowser('/notes.txt')).toBe(true);
    });

    it('WEB_VIEW_EXTENSION에 없는 확장자이면 false를 반환한다', () => {
      expect(service.shouldShowInBrowser('/app.zip')).toBe(false);
    });
  });

  describe('uploadFile', () => {
    const file = { originalname: 'test.txt', buffer: Buffer.from('data') } as Express.Multer.File;

    it('지정된 디렉토리에 파일을 저장한다', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockFs.lstatSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
      mockFs.writeFileSync.mockReturnValue(undefined);

      service.uploadFile('/uploads', file);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        path.join(SERVE_ROOT, '/uploads', 'test.txt'),
        file.buffer,
      );
    });

    it('path traversal은 HTTP 400을 던진다', () => {
      expect(() => service.uploadFile('/../etc', file)).toThrow(
        new HttpException('잘못된 경로입니다.', 400),
      );
    });

    it('디렉토리가 없으면 HTTP 404를 던진다', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => service.uploadFile('/notfound', file)).toThrow(
        new HttpException('디렉토리가 존재하지 않습니다.', 404),
      );
    });

    it('대상이 디렉토리가 아니면 HTTP 400을 던진다', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockFs.lstatSync as jest.Mock).mockReturnValue({ isDirectory: () => false });

      expect(() => service.uploadFile('/file.txt', file)).toThrow(
        new HttpException('업로드 대상이 디렉토리가 아닙니다.', 400),
      );
    });
  });

  describe('mkdir', () => {
    it('새 디렉토리를 생성한다', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);

      service.mkdir('/newdir');

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.join(SERVE_ROOT, '/newdir'),
      );
    });

    it('path traversal은 HTTP 400을 던진다', () => {
      expect(() => service.mkdir('/../etc/evil')).toThrow(
        new HttpException('잘못된 경로입니다.', 400),
      );
    });

    it('이미 존재하면 HTTP 409를 던진다', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);

      expect(() => service.mkdir('/existing')).toThrow(
        new HttpException('이미 존재하는 디렉토리입니다.', 409),
      );
    });
  });

  describe('rmdir', () => {
    it('비어있는 디렉토리를 삭제한다', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockFs.lstatSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
      (mockFs.readdirSync as jest.Mock).mockReturnValue([]);
      mockFs.rmdirSync.mockReturnValue(undefined);

      service.rmdir('/emptydir');

      expect(mockFs.rmdirSync).toHaveBeenCalledWith(
        path.join(SERVE_ROOT, '/emptydir'),
      );
    });

    it('path traversal은 HTTP 400을 던진다', () => {
      expect(() => service.rmdir('/../etc')).toThrow(
        new HttpException('잘못된 경로입니다.', 400),
      );
    });

    it('미존재 디렉토리면 HTTP 404를 던진다', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => service.rmdir('/notfound')).toThrow(
        new HttpException('디렉토리가 존재하지 않습니다.', 404),
      );
    });

    it('파일이면 HTTP 400을 던진다', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockFs.lstatSync as jest.Mock).mockReturnValue({ isDirectory: () => false });

      expect(() => service.rmdir('/file.txt')).toThrow(
        new HttpException('디렉토리가 아닙니다.', 400),
      );
    });

    it('비어있지 않으면 HTTP 400을 던진다', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockFs.lstatSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['file.txt']);

      expect(() => service.rmdir('/notempty')).toThrow(
        new HttpException('비어있지 않은 디렉토리는 삭제할 수 없습니다.', 400),
      );
    });
  });

  describe('deleteFile', () => {
    it('파일을 삭제한다', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockFs.lstatSync as jest.Mock).mockReturnValue({ isDirectory: () => false });
      mockFs.unlinkSync.mockReturnValue(undefined);

      service.deleteFile('/docs/report.pdf');

      expect(mockFs.unlinkSync).toHaveBeenCalledWith(
        path.join(SERVE_ROOT, '/docs/report.pdf'),
      );
    });

    it('path traversal은 HTTP 400을 던진다', () => {
      expect(() => service.deleteFile('/../etc/passwd')).toThrow(
        new HttpException('잘못된 경로입니다.', 400),
      );
    });

    it('파일이 없으면 HTTP 404를 던진다', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => service.deleteFile('/notfound.txt')).toThrow(
        new HttpException('파일이 존재하지 않습니다.', 404),
      );
    });

    it('디렉토리이면 HTTP 400을 던진다', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockFs.lstatSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      expect(() => service.deleteFile('/somedir')).toThrow(
        new HttpException('파일이 아닙니다.', 400),
      );
    });
  });

  describe('canWrite', () => {
    it('rw 권한 경로에서 true를 반환한다', () => {
      const raw = JSON.stringify([{ path: '/uploads', access: 'rw' }]);
      expect(service.canWrite(raw, '/uploads/file.txt')).toBe(true);
    });

    it('r 권한만 있는 경로에서 false를 반환한다', () => {
      const raw = JSON.stringify([{ path: '/uploads', access: 'r' }]);
      expect(service.canWrite(raw, '/uploads/file.txt')).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('rwd 권한 경로에서 true를 반환한다', () => {
      const raw = JSON.stringify([{ path: '/uploads', access: 'rwd' }]);
      expect(service.canDelete(raw, '/uploads/dir')).toBe(true);
    });

    it('rw 권한만 있는 경로에서 false를 반환한다', () => {
      const raw = JSON.stringify([{ path: '/uploads', access: 'rw' }]);
      expect(service.canDelete(raw, '/uploads/dir')).toBe(false);
    });
  });
});
