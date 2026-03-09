import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { UsersRepository } from '../data/user.repository';
import { UserEntity } from '../data/user.schema';

// __analysis.md > 도메인 2: User > UsersService

const mockRepo = () => ({
  findByUsername: jest.fn(),
  getAllUsers: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  changePassword: jest.fn(),
  deleteUser: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useFactory: mockRepo },
      ],
    }).compile();

    service = module.get(UsersService);
    repo = module.get(UsersRepository);
  });

  describe('verifyUser', () => {
    it('자격증명이 유효하면 password가 제외된 UserDTO를 반환한다', async () => {
      const hash = await bcrypt.hash('pass123', 10);
      repo.findByUsername.mockResolvedValue({
        seq: 1, username: 'alice', password: hash, permission: '[]',
      } as UserEntity);

      const result = await service.verifyUser({ username: 'alice', password: 'pass123' });

      expect(result).not.toHaveProperty('password');
      expect(result.username).toBe('alice');
    });

    it('유저가 없으면 BadRequestException을 던진다', async () => {
      repo.findByUsername.mockResolvedValue(null);

      await expect(
        service.verifyUser({ username: 'nobody', password: 'pass' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('비밀번호가 틀리면 BadRequestException을 던진다', async () => {
      const hash = await bcrypt.hash('correct', 10);
      repo.findByUsername.mockResolvedValue({
        username: 'alice', password: hash,
      } as UserEntity);

      await expect(
        service.verifyUser({ username: 'alice', password: 'wrong' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('유저 미존재와 비밀번호 오류는 동일한 메시지를 반환한다 (타이밍 공격 방지)', async () => {
      repo.findByUsername.mockResolvedValue(null);
      let msg1: string;
      try { await service.verifyUser({ username: 'nobody', password: 'x' }); }
      catch (e) { msg1 = (e as BadRequestException).message; }

      const hash = await bcrypt.hash('correct', 10);
      repo.findByUsername.mockResolvedValue({ username: 'alice', password: hash } as UserEntity);
      let msg2: string;
      try { await service.verifyUser({ username: 'alice', password: 'wrong' }); }
      catch (e) { msg2 = (e as BadRequestException).message; }

      expect(msg1!).toBe(msg2!);
    });
  });

  describe('removeUser', () => {
    it('유저가 존재하면 삭제하고 결과를 반환한다', async () => {
      const user = { seq: 1, username: 'alice' } as UserEntity;
      repo.findByUsername.mockResolvedValue(user);
      repo.deleteUser.mockResolvedValue(true);

      const result = await service.removeUser('alice');

      expect(repo.deleteUser).toHaveBeenCalledWith(user);
      expect(result).toBe(true);
    });

    it('유저가 없으면 HTTP 400을 던진다', async () => {
      repo.findByUsername.mockResolvedValue(null);

      await expect(service.removeUser('nobody')).rejects.toThrow(
        new HttpException('유저를 찾을 수 없습니다.', 400),
      );
    });
  });

  describe('위임 메서드', () => {
    it('findByUsername은 repository에 위임한다', async () => {
      const user = { seq: 1, username: 'alice' } as UserEntity;
      repo.findByUsername.mockResolvedValue(user);

      expect(await service.findByUsername('alice')).toEqual(user);
      expect(repo.findByUsername).toHaveBeenCalledWith('alice');
    });

    it('listAllUsers는 repository에 위임한다', async () => {
      repo.getAllUsers.mockResolvedValue([]);
      await service.listAllUsers();
      expect(repo.getAllUsers).toHaveBeenCalled();
    });

    it('signUp은 repository에 위임한다', async () => {
      repo.createUser.mockResolvedValue(undefined);
      await service.signUp({ username: 'alice', password: 'pass' });
      expect(repo.createUser).toHaveBeenCalledWith({ username: 'alice', password: 'pass' });
    });

    it('updateUser는 repository에 위임한다', async () => {
      repo.updateUser.mockResolvedValue(undefined);
      const dto = { username: 'alice', password: 'new' };
      await service.updateUser(dto);
      expect(repo.updateUser).toHaveBeenCalledWith(dto);
    });

    it('changePassword는 repository에 위임한다', async () => {
      repo.changePassword.mockResolvedValue(undefined);
      const dto = { currentPassword: 'old', newPassword: 'new' };
      await service.changePassword('alice', dto);
      expect(repo.changePassword).toHaveBeenCalledWith('alice', dto);
    });
  });
});
