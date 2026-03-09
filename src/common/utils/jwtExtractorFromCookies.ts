import { Request } from 'express';
import type { JwtFromRequestFunction } from 'passport-jwt';

export const jwtExtractorFromCookies = (request: Request): string | null => {
  try {
    return request.cookies['jwt'] ?? null;
  } catch {
    return null;
  }
};

export const jwtExtractorForPassport =
  jwtExtractorFromCookies as unknown as JwtFromRequestFunction;
