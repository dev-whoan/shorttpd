import { IsString, IsNotEmpty } from 'class-validator';

export class UserChangePasswordDTO {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
