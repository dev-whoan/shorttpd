import { createHash } from 'crypto';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from 'src/users/data/user.repository';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const username =
      this.configService.get<string>('ADMIN_USERNAME') ?? 'shorttpd';
    const password =
      this.configService.get<string>('ADMIN_PASSWORD') ?? 'shorttpd_password';

    const existing = await this.usersRepository.findByUsername(username);

    if (existing) {
      return;
    }

    const hashedPassword = createHash('sha256').update(password).digest('hex');

    await this.usersRepository.createUser({
      username,
      password: hashedPassword,
      permissions: [],
    });

    this.logger.log(`Admin user '${username}' created.`);
  }
}
