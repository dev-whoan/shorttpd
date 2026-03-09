import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PermissionGuard } from './permission.guard';
import { UsersService } from 'src/users/service/users.service';

// __analysis.md > 도메인 5: PermissionGuard

const makeCtx = (method: string, reqPath: string, cookies: Record<string, string> = {}) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ method, path: reqPath, cookies }),
    }),
  }) as unknown as ExecutionContext;

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let usersService: jest.Mocked<UsersService>;

  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv, USE_AUTH: 'yes' };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'JWT_SECRET') return 'secret';
              if (key === 'ADMIN_USERNAME') return 'admin';
            }),
          },
        },
        { provide: UsersService, useValue: { findByUsername: jest.fn() } },
      ],
    }).compile();

    guard = module.get(PermissionGuard);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('GET 요청은 항상 통과한다', async () => {
    await expect(guard.canActivate(makeCtx('GET', '/files'))).resolves.toBe(true);
  });

  it('USE_AUTH가 yes가 아니면 POST도 통과한다', async () => {
    process.env.USE_AUTH = 'no';
    await expect(guard.canActivate(makeCtx('POST', '/files'))).resolves.toBe(true);
  });

  it('JWT 쿠키가 없으면 ForbiddenException을 던진다', async () => {
    await expect(guard.canActivate(makeCtx('POST', '/files', {}))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('JWT 검증 실패 시 ForbiddenException을 던진다', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
    await expect(
      guard.canActivate(makeCtx('POST', '/files', { jwt: 'bad.token' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('admin 유저는 POST 권한 검사 없이 통과한다', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'admin' });
    await expect(
      guard.canActivate(makeCtx('POST', '/files', { jwt: 'token' })),
    ).resolves.toBe(true);
  });

  it('admin 유저는 DELETE도 통과한다', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'admin' });
    await expect(
      guard.canActivate(makeCtx('DELETE', '/files/dir', { jwt: 'token' })),
    ).resolves.toBe(true);
  });

  it('DB에 없는 유저면 ForbiddenException을 던진다', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'alice' });
    usersService.findByUsername.mockResolvedValue(null);
    await expect(
      guard.canActivate(makeCtx('POST', '/files', { jwt: 'token' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rw 권한 경로에서 POST는 통과한다', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'alice' });
    usersService.findByUsername.mockResolvedValue({
      permission: JSON.stringify([{ path: '/files', access: 'rw' }]),
    } as any);
    await expect(
      guard.canActivate(makeCtx('POST', '/files', { jwt: 'token' })),
    ).resolves.toBe(true);
  });

  it('r 권한만 있는 경로에서 POST는 ForbiddenException을 던진다', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'alice' });
    usersService.findByUsername.mockResolvedValue({
      permission: JSON.stringify([{ path: '/files', access: 'r' }]),
    } as any);
    await expect(
      guard.canActivate(makeCtx('POST', '/files', { jwt: 'token' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rwd 권한 경로에서 DELETE는 통과한다', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'alice' });
    usersService.findByUsername.mockResolvedValue({
      permission: JSON.stringify([{ path: '/files', access: 'rwd' }]),
    } as any);
    await expect(
      guard.canActivate(makeCtx('DELETE', '/files/dir', { jwt: 'token' })),
    ).resolves.toBe(true);
  });

  it('rw 권한만 있는 경로에서 DELETE는 ForbiddenException을 던진다', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'alice' });
    usersService.findByUsername.mockResolvedValue({
      permission: JSON.stringify([{ path: '/files', access: 'rw' }]),
    } as any);
    await expect(
      guard.canActivate(makeCtx('DELETE', '/files/dir', { jwt: 'token' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('* wildcard 권한으로 모든 경로에 쓰기 접근할 수 있다', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'alice' });
    usersService.findByUsername.mockResolvedValue({
      permission: JSON.stringify([{ path: '*', access: 'rw' }]),
    } as any);
    await expect(
      guard.canActivate(makeCtx('POST', '/any/path', { jwt: 'token' })),
    ).resolves.toBe(true);
  });
});
