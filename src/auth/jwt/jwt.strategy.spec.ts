import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from 'src/users/service/users.service';

// __analysis.md > 도메인 3: Auth > JwtStrategy
// PassportStrategy 상속 특성상 인스턴스 생성 없이 validate() 메서드를 직접 단위 테스트

describe('JwtStrategy.validate', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    usersService = { findByUsername: jest.fn() } as any;
    configService = {
      get: jest.fn().mockImplementation((key: string, def?: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'ADMIN_USERNAME') return def ?? 'shorttpd';
        return def;
      }),
    } as any;

    // PassportStrategy super() 호출 없이 validate만 테스트
    strategy = Object.create(JwtStrategy.prototype);
    (strategy as any).userService = usersService;
    (strategy as any).configService = configService;
  });

  it('payload.sub가 ADMIN_USERNAME이면 DB 조회 없이 admin 객체를 반환한다', async () => {
    const result = await strategy.validate({ sub: 'shorttpd' });

    expect(usersService.findByUsername).not.toHaveBeenCalled();
    expect(result).toMatchObject({ username: 'shorttpd' });
  });

  it('admin 객체는 rwd 전체 권한을 가진다', async () => {
    const result = await strategy.validate({ sub: 'shorttpd' });

    const permissions = JSON.parse((result as any).permission);
    expect(permissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '*', access: 'rwd' }),
      ]),
    );
  });

  it('일반 유저는 DB에서 조회하여 반환한다', async () => {
    const user = { seq: 1, username: 'alice', password: 'hashed', permission: '[]' };
    usersService.findByUsername.mockResolvedValue(user as any);

    const result = await strategy.validate({ sub: 'alice' });

    expect(usersService.findByUsername).toHaveBeenCalledWith('alice');
    expect(result).toEqual(user);
  });

  it('일반 유저가 DB에 없으면 UnauthorizedException을 던진다', async () => {
    usersService.findByUsername.mockResolvedValue(null);

    await expect(strategy.validate({ sub: 'unknown' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
