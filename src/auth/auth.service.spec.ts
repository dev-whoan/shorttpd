import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

// __analysis.md > 도메인 3: Auth > AuthService

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  describe('signJwt', () => {
    it('{ sub: username } 페이로드로 JWT를 발급한다', async () => {
      configService.get.mockReturnValue('test-secret');
      jwtService.signAsync.mockResolvedValue('signed.jwt.token');

      const token = await service.signJwt('alice');

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'alice' },
        { secret: 'test-secret' },
      );
      expect(token).toBe('signed.jwt.token');
    });

    it('시크릿은 ConfigService에서 JWT_SECRET 키로 읽는다', async () => {
      configService.get.mockReturnValue('my-secret');
      jwtService.signAsync.mockResolvedValue('token');

      await service.signJwt('bob');

      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('JwtService 오류 시 InternalServerErrorException을 던진다', async () => {
      configService.get.mockReturnValue('secret');
      jwtService.signAsync.mockRejectedValue(new Error('signing failed'));

      await expect(service.signJwt('alice')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
