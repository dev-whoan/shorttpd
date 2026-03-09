import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Render,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PublicFromJWT } from 'src/common/decorator/is-public.decorate';
import { AuthService } from 'src/auth/auth.service';
import { UserLoginDTO } from '../data/dto/user.login.dto';
import { UserRegisterDTO } from '../data/dto/user.register.dto';
import { UserUpdateDTO } from '../data/dto/user.update.dto';
import { UserChangePasswordDTO } from '../data/dto/user.change-password.dto';
import { UsersService } from '../service/users.service';
import { parsePermissions } from 'src/common/permission/permission.types';

const ACCESS_CLASS: Record<string, string> = {
  r: 'bg-blue-100 text-blue-700',
  rw: 'bg-green-100 text-green-700',
  rwd: 'bg-orange-100 text-orange-700',
};

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @PublicFromJWT()
  @Post('signup')
  signUp(@Body() dto: UserRegisterDTO) {
    return this.userService.signUp(dto);
  }

  @Delete()
  removeUser(@Body('username') username: string) {
    return this.userService.removeUser(username);
  }

  @Patch()
  updateUser(@Body() dto: UserUpdateDTO) {
    return this.userService.updateUser(dto);
  }

  @Patch('password')
  changePassword(@Req() req: Request, @Body() dto: UserChangePasswordDTO) {
    const user = req.user as { username: string };
    return this.userService.changePassword(user.username, dto);
  }

  @Get('profile')
  @Render('profile')
  async renderProfile(@Req() req: Request) {
    const user = req.user as { username: string; permission: string };
    const permissions = parsePermissions(user.permission).map((p) => ({
      ...p,
      accessClass: ACCESS_CLASS[p.access] ?? '',
    }));

    return {
      username: user.username,
      initial: user.username.charAt(0).toUpperCase(),
      permissions,
    };
  }

  @PublicFromJWT()
  @Get('login')
  @Render('login')
  renderLogin() {}

  @PublicFromJWT()
  @Post('login')
  async login(
    @Body() dto: UserLoginDTO,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.userService.verifyUser(dto);
    const jwt = await this.authService.signJwt(user.username);
    response.cookie('jwt', jwt, { httpOnly: true });
    return user;
  }

  @PublicFromJWT()
  @Post('logout')
  logOut(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('jwt');
  }
}
