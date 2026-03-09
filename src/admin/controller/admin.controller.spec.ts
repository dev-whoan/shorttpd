import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { UsersService } from 'src/users/service/users.service';
import { AuthService } from 'src/auth/auth.service';
import { Response } from 'express';

// __analysis.md — AdminController: admin JWT 발급 후 유저 목록 반환

describe('AdminController', () => {
  let controller: AdminController;
  let usersService: jest.Mocked<UsersService>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: UsersService, useValue: { listAllUsers: jest.fn() } },
        { provide: AuthService, useValue: { signJwt: jest.fn() } },
      ],
    }).compile();

    controller = module.get(AdminController);
    usersService = module.get(UsersService);
    authService = module.get(AuthService);
  });

  describe('root', () => {
    it('admin JWT를 발급하여 httpOnly 쿠키에 설정한다', async () => {
      authService.signJwt.mockResolvedValue('admin.token');
      usersService.listAllUsers.mockResolvedValue([]);
      const res = { cookie: jest.fn() } as unknown as Response;

      await controller.root(res);

      expect(authService.signJwt).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalledWith('jwt', 'admin.token', { httpOnly: true });
    });

    it('전체 유저 목록을 data.user_list로 반환한다', async () => {
      const users = [{ seq: 1, username: 'alice', permission: '[]' }] as any[];
      authService.signJwt.mockResolvedValue('token');
      usersService.listAllUsers.mockResolvedValue(users);
      const res = { cookie: jest.fn() } as unknown as Response;

      const result = await controller.root(res);

      expect(result).toEqual({ data: { user_list: users } });
    });
  });
});
