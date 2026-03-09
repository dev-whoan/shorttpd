import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './user.schema';
import { UserDTO } from './dto/user.dto';
import { UserRegisterDTO } from './dto/user.register.dto';
import { UserUpdateDTO } from './dto/user.update.dto';
import { UserChangePasswordDTO } from './dto/user.change-password.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userModel: Repository<UserEntity>,
  ) {}

  getAllUsers(): Promise<UserDTO[]> {
    return this.userModel.find();
  }

  findByUsername(username: string): Promise<UserEntity | null> {
    return this.userModel.findOneBy({ username });
  }

  async createUser(dto: UserRegisterDTO): Promise<void> {
    const existing = await this.userModel.findOneBy({ username: dto.username });

    if (existing) {
      throw new HttpException('이미 존재하는 유저입니다', 409);
    }

    await this.userModel.save({
      username: dto.username,
      password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      permission: JSON.stringify(dto.permissions ?? []),
    });
  }

  async updateUser(dto: UserUpdateDTO): Promise<void> {
    const user = await this.userModel.findOneBy({ username: dto.username });

    if (!user) {
      throw new HttpException('유저를 찾을 수 없습니다.', 404);
    }

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }

    if (dto.permissions !== undefined) {
      user.permission = JSON.stringify(dto.permissions);
    }

    await this.userModel.save(user);
  }

  async changePassword(username: string, dto: UserChangePasswordDTO): Promise<void> {
    const user = await this.userModel.findOneBy({ username });

    if (!user) {
      throw new HttpException('유저를 찾을 수 없습니다.', 404);
    }

    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new HttpException('현재 비밀번호가 올바르지 않습니다.', 400);
    }

    user.password = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.userModel.save(user);
  }

  async deleteUser(user: UserEntity): Promise<boolean> {
    const result = await this.userModel.delete({ seq: user.seq });
    return !!result;
  }
}
