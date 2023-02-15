import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRegisterDTO } from './dto/user.register.dto';
import { UserEntity } from './user.schema';
import * as bcrypt from 'bcrypt';
import { UserLoginDTO } from './dto/user.login.dto';
import { UserDTO } from './dto/user.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userModel: Repository<UserEntity>,
  ) {}

  async getAllUser(): Promise<UserDTO[]> {
    try {
      const user = await this.userModel.find();
      if (!user) throw new Error();
      return user;
    } catch (error) {
      throw new BadRequestException('유저를 찾을 수 없습니다.');
    }
  }

  async findByUsername(username: string): Promise<UserEntity> {
    try {
      const user = await this.userModel.findOneBy({ username });
      if (!user) throw new Error();

      return user;
    } catch (error) {
      throw new BadRequestException('이메일과 비밀번호를 확인해주세요.');
    }
  }

  async deleteUser(user: UserEntity): Promise<boolean> {
    try {
      const reuslt = this.userModel.delete(user);
      return reuslt ? true : false;
    } catch (error) {
      throw new BadRequestException('대상 유저를 찾을 수 없습니다.');
    }
  }

  async createUser(userRegisterDTO: UserRegisterDTO): Promise<void> {
    const { username, password } = userRegisterDTO;
    const user = await this.userModel.findOneBy({ username });
    if (user) {
      throw new HttpException('이미 존재하는 유저입니다', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('hashed:', hashedPassword, 'unhashed: ', password);
    await this.userModel.save({
      ...userRegisterDTO,
      password: hashedPassword,
    });

    // return newUser;
  }
}
