import { PickType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';
import { UserEntity } from '../user.schema';

export class UserLoginDTO extends PickType(UserEntity, ['username'] as const) {
  @IsString()
  @IsNotEmpty({ message: '비밀번호를 입력해 주세요.' })
  password: string;
}
