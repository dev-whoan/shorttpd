import { OmitType } from '@nestjs/swagger';
import { UserEntity } from '../user.schema';

export class UserDTO extends OmitType(UserEntity, ['password'] as const) {}
