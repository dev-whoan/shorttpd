import { OmitType } from '@nestjs/mapped-types';
import { UserEntity } from '../user.schema';

export class UserDTO extends OmitType(UserEntity, ['password'] as const) {}
