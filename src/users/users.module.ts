import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from 'src/auth/jwt/jwt.strategy';
import { UsersController } from './controller/users.controller';
import { UsersRepository } from './data/user.repository';
import { UserEntity } from './data/user.schema';
import { UsersService } from './service/users.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule.register({ defaultStrategy: 'jwt', session: true }),
    JwtModule.register({
      secret: process.env.SECRET_KEY,
      secretOrPrivateKey: process.env.SECRET_KEY,
      signOptions: { expiresIn: '10m' },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, JwtStrategy],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
