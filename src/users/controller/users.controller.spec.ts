import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../service/users.service';
import { AuthService } from 'src/auth/auth.service';
import { Request, Response } from 'express';

// __analysis.md — UsersController

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            verifyUser: jest.fn(),
            signUp: jest.fn(),
            removeUser: jest.fn(),
            updateUser: jest.fn(),
            changePassword: jest.fn(),
          },
        },
        { provide: AuthService, useValue: { signJwt: jest.fn() } },
      ],
    }).compile();

    controller = module.get(UsersController);
    usersService = module.get(UsersService);
    authService = module.get(AuthService);
  });

  describe('login', () => {
    it('자격증명 검증 후 JWT를 쿠키에 설정하고 유저 정보를 반환한다', async () => {
      const userDto = { seq: 1, username: 'alice', permission: '[]' } as any;
      usersService.verifyUser.mockResolvedValue(userDto);
      authService.signJwt.mockResolvedValue('signed.token');
      const res = { cookie: jest.fn() } as unknown as Response;

      const result = await controller.login({ username: 'alice', password: 'pass' }, res);

      expect(usersService.verifyUser).toHaveBeenCalledWith({ username: 'alice', password: 'pass' });
      expect(authService.signJwt).toHaveBeenCalledWith('alice');
      expect(res.cookie).toHaveBeenCalledWith('jwt', 'signed.token', { httpOnly: true });
      expect(result).toEqual(userDto);
    });
  });

  describe('logOut', () => {
    it('jwt 쿠키를 제거한다', () => {
      const res = { clearCookie: jest.fn() } as unknown as Response;
      controller.logOut(res);
      expect(res.clearCookie).toHaveBeenCalledWith('jwt');
    });
  });

  describe('signUp', () => {
    it('회원가입 요청을 UsersService에 위임한다', async () => {
      usersService.signUp.mockResolvedValue(undefined);
      await controller.signUp({ username: 'alice', password: 'pass' });
      expect(usersService.signUp).toHaveBeenCalledWith({ username: 'alice', password: 'pass' });
    });
  });

  describe('changePassword', () => {
    it('인증된 유저의 비밀번호 변경을 UsersService에 위임한다', async () => {
      usersService.changePassword.mockResolvedValue(undefined);
      const req = { user: { username: 'alice' } } as unknown as Request;

      await controller.changePassword(req, { currentPassword: 'old', newPassword: 'new' });

      expect(usersService.changePassword).toHaveBeenCalledWith('alice', {
        currentPassword: 'old',
        newPassword: 'new',
      });
    });
  });
});
