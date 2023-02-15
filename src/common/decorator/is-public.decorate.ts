import { SetMetadata } from '@nestjs/common';

export const PublicFromJWT = () => SetMetadata('isPublicFromJWT', true);
