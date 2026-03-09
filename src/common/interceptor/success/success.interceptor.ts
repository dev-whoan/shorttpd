import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';

@Injectable()
export class SuccessInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const template = this.reflector.get<string>(
      '__renderTemplate__',
      context.getHandler(),
    );

    if (template) {
      return next.handle();
    }

    return next.handle().pipe(map((data) => ({ success: true, data })));
  }
}
