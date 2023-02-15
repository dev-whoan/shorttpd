import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserLoginDTO } from '../data/dto/user.login.dto';
import { UsersRepository } from '../data/user.repository';
import { UserEntity } from '../data/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRegisterDTO } from '../data/dto/user.register.dto';
import { UserDTO } from '../data/dto/user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger('UserService');

  constructor(
    // @InjectRepository(UserEntity)
    // private readonly userRepository: Repository<UserEntity>,
    private readonly userRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async findByUsername(username: string): Promise<UserEntity | null> {
    return await this.userRepository.findByUsername(username);
  }

  async listAllUsers(): Promise<UserDTO[]> {
    return await this.userRepository.getAllUser();
  }

  async signUp(userRegisterDTO: UserRegisterDTO): Promise<void> {
    return await this.userRepository.createUser(userRegisterDTO);
  }

  async removeUser(username: string): Promise<boolean> {
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      throw new HttpException('유저를 찾을 수 없습니다.', 400);
    }

    return await this.userRepository.deleteUser(user);
  }

  async verifyUserAndSignJWT(
    userLoginDTO: UserLoginDTO,
  ): Promise<{ jwt: string; user: UserDTO }> {
    const user = await this.userRepository.findByUsername(
      userLoginDTO.username,
    );

    if (!user) {
      throw new HttpException('이메일과 비밀번호를 확인해주세요.', 401);
    }

    if (!(await bcrypt.compare(userLoginDTO.password, user.password))) {
      throw new HttpException('이메일과 비밀번호를 확인해주세요.', 401);
    }
    try {
      const jwt = await this.jwtService.signAsync(
        { sub: user.username },
        { secret: process.env.JWT_SECRET },
      );

      if (!!user.password) {
        delete user.password;
      }

      return { jwt, user };
    } catch (error) {}
  }
}
