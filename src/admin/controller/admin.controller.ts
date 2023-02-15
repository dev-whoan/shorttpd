import { PublicFromJWT } from './../../common/decorator/is-public.decorate';
import { Controller, Get, Post, Render, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { UsersService } from 'src/users/service/users.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly userService: UsersService) {}

  @PublicFromJWT()
  @Get()
  @Render('admin')
  async root() {
    const users = await this.userService.listAllUsers();
    return { user_list: users };
  }
}
