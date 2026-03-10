import { PublicFromJWT } from './../../common/decorator/is-public.decorate';
import { Controller, Get, Render, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/service/users.service';

@Controller(process.env.ADMIN_PAGE_PREFIX ?? 'admin')
export class AdminController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @PublicFromJWT()
  @Get()
  @Render('admin')
  async root(@Res({ passthrough: true }) response: Response) {
    const adminUsername = process.env.ADMIN_USERNAME ?? 'shorttpd';
    const jwt = await this.authService.signJwt(adminUsername);
    response.cookie('jwt', jwt, { httpOnly: true });

    const users = await this.userService.listAllUsers();
    return { data: { user_list: users } };
  }
}
