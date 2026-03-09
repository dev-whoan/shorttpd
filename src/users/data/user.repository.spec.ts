import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './user.repository';
import { UserEntity } from './user.schema';

// __analysis.md > 도메인 2: User > UsersRepository

const mockorm = () => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

describe('UsersRepository', () => {
  let repo: UsersRepository;
  let orm: ReturnType<typeof mockorm>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: getRepositoryToken(UserEntity), useFactory: mockorm },
      ],
    }).compile();

    repo = module.get(UsersRepository);
    orm = module.get(getRepositoryToken(UserEntity));
  });

  describe('getAllUsers', () => {
    it('전체 유저 목록을 반환한다', async () => {
      const users = [{ seq: 1, username: 'alice' }] as UserEntity[];
      orm.find.mockResolvedValue(users);
      expect(await repo.getAllUsers()).toEqual(users);
    });
  });

  describe('findByUsername', () => {
    it('존재하는 username이면 UserEntity를 반환한다', async () => {
      const user = { seq: 1, username: 'alice' } as UserEntity;
      orm.findOneBy.mockResolvedValue(user);
      expect(await repo.findByUsername('alice')).toEqual(user);
      expect(orm.findOneBy).toHaveBeenCalledWith({ username: 'alice' });
    });

    it('존재하지 않으면 null을 반환한다 (예외 없음)', async () => {
      orm.findOneBy.mockResolvedValue(null);
      expect(await repo.findByUsername('nobody')).toBeNull();
    });
  });

  describe('createUser', () => {
    it('비밀번호를 bcrypt 해시 후 저장한다', async () => {
      orm.findOneBy.mockResolvedValue(null);
      orm.save.mockResolvedValue(undefined);

      await repo.createUser({ username: 'alice', password: 'plaintext' });

      const saved = orm.save.mock.calls[0][0];
      expect(await bcrypt.compare('plaintext', saved.password)).toBe(true);
      expect(saved.username).toBe('alice');
    });

    it('permissions 미전달 시 빈 배열 JSON으로 저장한다', async () => {
      orm.findOneBy.mockResolvedValue(null);
      orm.save.mockResolvedValue(undefined);

      await repo.createUser({ username: 'bob', password: 'pass' });

      expect(orm.save.mock.calls[0][0].permission).toBe('[]');
    });

    it('permissions 전달 시 JSON 문자열로 저장한다', async () => {
      orm.findOneBy.mockResolvedValue(null);
      orm.save.mockResolvedValue(undefined);

      await repo.createUser({
        username: 'carol',
        password: 'pass',
        permissions: [{ path: '/docs', access: 'r' }],
      });

      expect(orm.save.mock.calls[0][0].permission).toBe(
        JSON.stringify([{ path: '/docs', access: 'r' }]),
      );
    });

    it('username 중복 시 HTTP 409를 던진다', async () => {
      orm.findOneBy.mockResolvedValue({ seq: 1 } as UserEntity);

      await expect(
        repo.createUser({ username: 'alice', password: 'pass' }),
      ).rejects.toThrow(new HttpException('이미 존재하는 유저입니다', 409));
    });
  });

  describe('deleteUser', () => {
    it('seq 기준으로 삭제하고 true를 반환한다', async () => {
      orm.delete.mockResolvedValue({ affected: 1, raw: {} });
      const user = { seq: 1, username: 'alice' } as UserEntity;

      const result = await repo.deleteUser(user);

      expect(orm.delete).toHaveBeenCalledWith({ seq: 1 });
      expect(result).toBe(true);
    });
  });

  describe('updateUser', () => {
    const existing = {
      seq: 1,
      username: 'alice',
      password: 'old-hash',
      permission: '[]',
    } as UserEntity;

    it('password 전달 시 bcrypt 해시 후 업데이트한다', async () => {
      orm.findOneBy.mockResolvedValue({ ...existing });
      orm.save.mockResolvedValue(undefined);

      await repo.updateUser({ username: 'alice', password: 'newpass' });

      const saved = orm.save.mock.calls[0][0];
      expect(await bcrypt.compare('newpass', saved.password)).toBe(true);
    });

    it('permissions 전달 시 JSON 문자열로 업데이트한다', async () => {
      orm.findOneBy.mockResolvedValue({ ...existing });
      orm.save.mockResolvedValue(undefined);

      await repo.updateUser({
        username: 'alice',
        permissions: [{ path: '/uploads', access: 'rw' }],
      });

      expect(orm.save.mock.calls[0][0].permission).toBe(
        JSON.stringify([{ path: '/uploads', access: 'rw' }]),
      );
    });

    it('두 필드 모두 없으면 기존 값을 유지한다', async () => {
      orm.findOneBy.mockResolvedValue({ ...existing });
      orm.save.mockResolvedValue(undefined);

      await repo.updateUser({ username: 'alice' });

      const saved = orm.save.mock.calls[0][0];
      expect(saved.password).toBe('old-hash');
      expect(saved.permission).toBe('[]');
    });

    it('username 미존재 시 HTTP 404를 던진다', async () => {
      orm.findOneBy.mockResolvedValue(null);

      await expect(
        repo.updateUser({ username: 'nobody' }),
      ).rejects.toThrow(new HttpException('유저를 찾을 수 없습니다.', 404));
    });
  });

  describe('changePassword', () => {
    it('현재 비밀번호 일치 시 새 비밀번호로 해시 후 저장한다', async () => {
      const hash = await bcrypt.hash('currentPass', 10);
      orm.findOneBy.mockResolvedValue({ username: 'alice', password: hash } as UserEntity);
      orm.save.mockResolvedValue(undefined);

      await repo.changePassword('alice', {
        currentPassword: 'currentPass',
        newPassword: 'newPass',
      });

      const saved = orm.save.mock.calls[0][0];
      expect(await bcrypt.compare('newPass', saved.password)).toBe(true);
    });

    it('현재 비밀번호 불일치 시 HTTP 400을 던진다', async () => {
      const hash = await bcrypt.hash('correct', 10);
      orm.findOneBy.mockResolvedValue({ username: 'alice', password: hash } as UserEntity);

      await expect(
        repo.changePassword('alice', { currentPassword: 'wrong', newPassword: 'new' }),
      ).rejects.toThrow(new HttpException('현재 비밀번호가 올바르지 않습니다.', 400));
    });

    it('유저 미존재 시 HTTP 404를 던진다', async () => {
      orm.findOneBy.mockResolvedValue(null);

      await expect(
        repo.changePassword('nobody', { currentPassword: 'p', newPassword: 'n' }),
      ).rejects.toThrow(new HttpException('유저를 찾을 수 없습니다.', 404));
    });
  });
});
