import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Render,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PublicFromJWT } from 'src/common/decorator/is-public.decorate';
import { UserLoginDTO } from '../data/dto/user.login.dto';
import { UserRegisterDTO } from '../data/dto/user.register.dto';
import { UsersService } from '../service/users.service';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger('UserController');

  constructor(private readonly userService: UsersService) {}

  @PublicFromJWT()
  @Post('signup')
  async signUp(@Body() userRegisterDTO: UserRegisterDTO) {
    return this.userService.signUp(userRegisterDTO);
  }

  @PublicFromJWT()
  @Delete()
  async removeUser(@Body('username') username: string) {
    return this.userService.removeUser(username);
  }

  @PublicFromJWT()
  @Get('login')
  @Render('login')
  async renderLogin() {}

  @PublicFromJWT()
  @Post('login')
  async login(
    @Body() userLoginDTO: UserLoginDTO,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { jwt, user } = await this.userService.verifyUserAndSignJWT(
      userLoginDTO,
    );

    response.cookie('jwt', jwt, { httpOnly: true });
    return user;
  }

  @PublicFromJWT()
  @Post('logout')
  async logOut(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('jwt');
    return;
  }
}
