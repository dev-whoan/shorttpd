import { Controller, Get, Render } from '@nestjs/common';
import { UsersService } from 'src/users/service/users.service';
import { AdminService } from '../service/admin.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly userService: UsersService,
  ) {}

  @Get()
  @Render('admin')
  async root() {
    const users = await this.userService.listAllUsers();
    console.log(users);
    return { user_list: users };
  }
}
