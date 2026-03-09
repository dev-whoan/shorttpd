import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signJwt(username: string): Promise<string> {
    try {
      return await this.jwtService.signAsync(
        { sub: username },
        { secret: this.configService.get<string>('JWT_SECRET') },
      );
    } catch {
      throw new InternalServerErrorException('JWT 서명에 실패했습니다.');
    }
  }
}
