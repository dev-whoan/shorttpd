import {
  parsePermissions,
  resolveAccess,
  canRead,
  canWrite,
  canDelete,
  PathPermission,
} from './permission.types';

// __analysis.md > 도메인 1: Permission

describe('parsePermissions', () => {
  it('유효한 JSON 배열을 PathPermission 배열로 파싱한다', () => {
    const raw = JSON.stringify([
      { path: '/docs', access: 'r' },
      { path: '/uploads', access: 'rw' },
    ]);
    expect(parsePermissions(raw)).toEqual([
      { path: '/docs', access: 'r' },
      { path: '/uploads', access: 'rw' },
    ]);
  });

  it('빈 배열 JSON은 빈 배열을 반환한다', () => {
    expect(parsePermissions('[]')).toEqual([]);
  });

  it('잘못된 JSON이면 빈 배열을 반환한다', () => {
    expect(parsePermissions('not-json')).toEqual([]);
    expect(parsePermissions('')).toEqual([]);
  });

  it('배열이 아닌 JSON이면 빈 배열을 반환한다', () => {
    expect(parsePermissions('{}')).toEqual([]);
    expect(parsePermissions('"string"')).toEqual([]);
  });

  it('path 또는 access가 string이 아닌 항목은 필터링한다', () => {
    const raw = JSON.stringify([
      { path: '/valid', access: 'r' },
      { path: 123, access: 'r' },
      { path: '/bad', access: null },
    ]);
    expect(parsePermissions(raw)).toEqual([{ path: '/valid', access: 'r' }]);
  });
});

describe('resolveAccess', () => {
  const permissions: PathPermission[] = [
    { path: '/docs', access: 'r' },
    { path: '/docs/private', access: 'rw' },
    { path: '/uploads', access: 'rwd' },
    { path: '*', access: 'r' },
  ];

  it('정확히 일치하는 경로를 매칭한다', () => {
    expect(resolveAccess(permissions, '/docs')).toBe('r');
    expect(resolveAccess(permissions, '/uploads')).toBe('rwd');
  });

  it('하위 경로는 prefix로 매칭한다', () => {
    expect(resolveAccess(permissions, '/docs/readme.txt')).toBe('r');
    expect(resolveAccess(permissions, '/uploads/file.zip')).toBe('rwd');
  });

  it('더 긴 prefix를 우선 매칭한다', () => {
    expect(resolveAccess(permissions, '/docs/private/secret.txt')).toBe('rw');
  });

  it('선행 /가 없는 경로도 정규화하여 매칭한다', () => {
    expect(resolveAccess(permissions, 'docs/readme.txt')).toBe('r');
  });

  it('일치하는 prefix가 없으면 * wildcard를 반환한다', () => {
    expect(resolveAccess(permissions, '/other/path')).toBe('r');
  });

  it('wildcard도 없고 매칭도 없으면 null을 반환한다', () => {
    const noWildcard: PathPermission[] = [{ path: '/docs', access: 'r' }];
    expect(resolveAccess(noWildcard, '/other')).toBeNull();
  });

  it('권한 목록이 비어있으면 null을 반환한다', () => {
    expect(resolveAccess([], '/any')).toBeNull();
  });
});

describe('canRead', () => {
  it('r, rw, rwd 모두 읽기 가능하다', () => {
    expect(canRead('r')).toBe(true);
    expect(canRead('rw')).toBe(true);
    expect(canRead('rwd')).toBe(true);
  });

  it('null이면 읽기 불가하다', () => {
    expect(canRead(null)).toBe(false);
  });
});

describe('canWrite', () => {
  it('rw, rwd는 쓰기 가능하다', () => {
    expect(canWrite('rw')).toBe(true);
    expect(canWrite('rwd')).toBe(true);
  });

  it('r, null은 쓰기 불가하다', () => {
    expect(canWrite('r')).toBe(false);
    expect(canWrite(null)).toBe(false);
  });
});

describe('canDelete', () => {
  it('rwd만 삭제 가능하다', () => {
    expect(canDelete('rwd')).toBe(true);
  });

  it('r, rw, null은 삭제 불가하다', () => {
    expect(canDelete('r')).toBe(false);
    expect(canDelete('rw')).toBe(false);
    expect(canDelete(null)).toBe(false);
  });
});
