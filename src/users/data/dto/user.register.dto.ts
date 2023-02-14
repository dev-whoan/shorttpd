import { PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { UserEntity } from '../user.schema';

export class UserRegisterDTO extends PickType(UserEntity, [
  'username',
] as const) {
  @IsString()
  @IsNotEmpty({ message: '비밀번호를 작성해 주세요.' })
  password: string;
}
