import { IsArray, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PathPermissionDTO } from './user.register.dto';

export class UserUpdateDTO {
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsArray()
  @Type(() => PathPermissionDTO)
  permissions?: PathPermissionDTO[];
}
