import { PickType } from '@nestjs/mapped-types';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserEntity } from '../user.schema';
import { AccessLevel, PathPermission } from 'src/common/permission/permission.types';

export class PathPermissionDTO implements PathPermission {
  @IsString()
  path: string;

  @IsString()
  access: AccessLevel;
}

export class UserRegisterDTO extends PickType(UserEntity, ['username'] as const) {
  @IsString()
  @IsNotEmpty({ message: '비밀번호를 작성해 주세요.' })
  password: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PathPermissionDTO)
  permissions?: PathPermissionDTO[];
}
