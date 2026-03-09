import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/service/users.service';
import { jwtExtractorFromCookies } from '../utils/jwtExtractorFromCookies';
import type { JwtFromRequestFunction } from 'passport-jwt';

const extractJwt = jwtExtractorFromCookies as unknown as JwtFromRequestFunction;
import {
  parsePermissions,
  resolveAccess,
  canWrite,
  canDelete,
} from '../permission/permission.types';

const GUARDED_METHODS = ['POST', 'PUT', 'DELETE'];

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    if (!GUARDED_METHODS.includes(request.method)) {
      return true;
    }

    if (process.env.USE_AUTH !== 'yes') {
      return true;
    }

    const token = extractJwt(request as any);

    if (!token) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    let username: string;

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        token,
        { secret: this.configService.get<string>('JWT_SECRET') },
      );
      username = payload.sub;
    } catch {
      throw new ForbiddenException('권한이 없습니다.');
    }

    const adminUsername =
      this.configService.get<string>('ADMIN_USERNAME') ?? 'shorttpd';

    if (username === adminUsername) {
      return true;
    }

    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    const access = resolveAccess(
      parsePermissions(user.permission),
      decodeURIComponent(request.path),
    );

    if (request.method === 'DELETE') {
      if (!canDelete(access)) {
        throw new ForbiddenException('이 경로에 대한 삭제 권한이 없습니다.');
      }
      return true;
    }

    if (!canWrite(access)) {
      throw new ForbiddenException('이 경로에 대한 쓰기 권한이 없습니다.');
    }

    return true;
  }
}
