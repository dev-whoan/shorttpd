import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtExtractorFromCookies } from 'src/common/utils/jwtExtractorFromCookies';
import { UsersService } from 'src/users/service/users.service';
import { JwtPayload } from './jwt.payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([jwtExtractorFromCookies]),
      secretOrKey: configService.get('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const user = await this.userService.findByUsername(payload.sub);
      if (user) {
        return user;
      } else {
        throw new Error('유저 정보를 확인해주세요.');
      }
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
