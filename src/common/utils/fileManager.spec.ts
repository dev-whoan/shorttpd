import * as fs from 'fs';
import { directoryReader } from './fileManager';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// __analysis.md > 도메인 4: Files > directoryReader

describe('directoryReader', () => {
  beforeEach(() => jest.clearAllMocks());

  it('디렉토리를 파일보다 먼저, 각각 알파벳 오름차순으로 반환한다', () => {
    (mockFs.readdirSync as jest.Mock).mockReturnValue([
      { name: 'zebra.txt', isDirectory: () => false },
      { name: 'alpha', isDirectory: () => true },
      { name: 'beta', isDirectory: () => true },
      { name: 'apple.txt', isDirectory: () => false },
    ]);
    (mockFs.statSync as jest.Mock).mockReturnValue({
      size: 1024,
      mtime: new Date('2024-01-01'),
    });

    const result = directoryReader('/serve', []);

    expect(result[0].name).toBe('alpha');
    expect(result[0].dir).toBe(true);
    expect(result[1].name).toBe('beta');
    expect(result[1].dir).toBe(true);
    expect(result[2].name).toBe('apple.txt');
    expect(result[2].dir).toBe(false);
    expect(result[3].name).toBe('zebra.txt');
  });

  it('excludes에 포함된 항목은 결과에서 제외한다', () => {
    (mockFs.readdirSync as jest.Mock).mockReturnValue([
      { name: 'visible.txt', isDirectory: () => false },
      { name: '.hidden', isDirectory: () => false },
      { name: 'node_modules', isDirectory: () => true },
    ]);
    (mockFs.statSync as jest.Mock).mockReturnValue({
      size: 100,
      mtime: new Date(),
    });

    const result = directoryReader('/serve', ['.hidden', 'node_modules']);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('visible.txt');
  });

  it('디렉토리 항목은 size="Directory", lastModified=null이다', () => {
    (mockFs.readdirSync as jest.Mock).mockReturnValue([
      { name: 'mydir', isDirectory: () => true },
    ]);

    const result = directoryReader('/serve', []);

    expect(result[0]).toEqual({
      name: 'mydir',
      dir: true,
      size: 'Directory',
      lastModified: null,
    });
  });

  it('파일 크기를 B / KB / MB / GB 단위로 포맷한다', () => {
    (mockFs.readdirSync as jest.Mock).mockReturnValue([
      { name: 'tiny.txt', isDirectory: () => false },
      { name: 'medium.zip', isDirectory: () => false },
      { name: 'large.iso', isDirectory: () => false },
      { name: 'huge.img', isDirectory: () => false },
    ]);
    (mockFs.statSync as jest.Mock)
      .mockReturnValueOnce({ size: 512, mtime: new Date() })
      .mockReturnValueOnce({ size: 2 * 1024 * 1024, mtime: new Date() })
      .mockReturnValueOnce({ size: 3 * 1024 * 1024 * 1024, mtime: new Date() })
      .mockReturnValueOnce({ size: 500, mtime: new Date() });

    const result = directoryReader('/serve', []);

    expect(result.find((f) => f.name === 'tiny.txt')?.size).toBe('512 B');
    expect(result.find((f) => f.name === 'medium.zip')?.size).toBe('2.0 MB');
    expect(result.find((f) => f.name === 'large.iso')?.size).toMatch(/GB/);
  });

  it('빈 디렉토리이면 빈 배열을 반환한다', () => {
    (mockFs.readdirSync as jest.Mock).mockReturnValue([]);
    expect(directoryReader('/serve', [])).toEqual([]);
  });
});
