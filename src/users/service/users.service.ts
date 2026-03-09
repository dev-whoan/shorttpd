import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../data/user.repository';
import { UserEntity } from '../data/user.schema';
import { UserDTO } from '../data/dto/user.dto';
import { UserLoginDTO } from '../data/dto/user.login.dto';
import { UserRegisterDTO } from '../data/dto/user.register.dto';
import { UserUpdateDTO } from '../data/dto/user.update.dto';
import { UserChangePasswordDTO } from '../data/dto/user.change-password.dto';

const INVALID_CREDENTIALS_MSG = '이메일과 비밀번호를 확인해주세요.';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UsersRepository) {}

  findByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepository.findByUsername(username);
  }

  listAllUsers(): Promise<UserDTO[]> {
    return this.userRepository.getAllUsers();
  }

  signUp(dto: UserRegisterDTO): Promise<void> {
    return this.userRepository.createUser(dto);
  }

  updateUser(dto: UserUpdateDTO): Promise<void> {
    return this.userRepository.updateUser(dto);
  }

  changePassword(username: string, dto: UserChangePasswordDTO): Promise<void> {
    return this.userRepository.changePassword(username, dto);
  }

  async removeUser(username: string): Promise<boolean> {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      throw new HttpException('유저를 찾을 수 없습니다.', 400);
    }

    return this.userRepository.deleteUser(user);
  }

  async verifyUser(dto: UserLoginDTO): Promise<UserDTO> {
    const user = await this.userRepository.findByUsername(dto.username);

    if (!user) {
      throw new BadRequestException(INVALID_CREDENTIALS_MSG);
    }

    if (!(await bcrypt.compare(dto.password, user.password))) {
      throw new BadRequestException(INVALID_CREDENTIALS_MSG);
    }

    const { password: _, ...userDto } = user;

    return userDto as UserDTO;
  }
}
