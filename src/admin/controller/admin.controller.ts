import { PublicFromJWT } from './../../common/decorator/is-public.decorate';
import {
  Body,
  Controller,
  Get,
  Post,
  Render,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/service/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { jwtExtractorFromCookies } from 'src/common/utils/jwtExtractorFromCookies';

const adminPrefix = () =>
  (process.env.ADMIN_PAGE_PREFIX ?? 'admin').replace(/^\//, '');

@Controller(process.env.ADMIN_PAGE_PREFIX ?? 'admin')
export class AdminController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private isAdminJwtValid(request: Request): boolean {
    const token = jwtExtractorFromCookies(request);

    if (!token) {
      return false;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const adminUsername =
        this.configService.get<string>('ADMIN_USERNAME') ?? 'shorttpd';

      return payload?.sub === adminUsername;
    } catch {
      return false;
    }
  }

  @PublicFromJWT()
  @Get()
  async root(
    @Req() request: Request,
    @Res() response: Response,
  ) {
    if (!this.isAdminJwtValid(request)) {
      return response.redirect(`/${adminPrefix()}/login`);
    }

    const users = await this.userService.listAllUsers();
    return response.render('admin', {
      data: { user_list: users },
      adminPrefix: adminPrefix(),
    });
  }

  @PublicFromJWT()
  @Get('login')
  @Render('admin-login')
  renderLogin(@Req() request: Request) {
    const error = (request.query as Record<string, string>).error === '1';
    return { adminPrefix: adminPrefix(), error };
  }

  @PublicFromJWT()
  @Post('login')
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
    @Res() response: Response,
  ) {
    const adminUsername =
      this.configService.get<string>('ADMIN_USERNAME') ?? 'shorttpd';

    if (username !== adminUsername) {
      return response.redirect(`/${adminPrefix()}/login?error=1`);
    }

    try {
      await this.userService.verifyUser({ username, password });
    } catch {
      return response.redirect(`/${adminPrefix()}/login?error=1`);
    }

    const jwt = await this.authService.signJwt(adminUsername);
    response.cookie('jwt', jwt, { httpOnly: true });
    return response.redirect(`/${adminPrefix()}`);
  }

  @PublicFromJWT()
  @Get('logout')
  logout(@Res() response: Response) {
    response.clearCookie('jwt', { httpOnly: true, path: '/' });
    return response.redirect(`/${adminPrefix()}/login`);
  }
}
