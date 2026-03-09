import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { SuccessInterceptor } from './success.interceptor';

// __analysis.md > 도메인 6: SuccessInterceptor

const makeCtx = (template?: string) => {
  const handler = jest.fn();
  const reflector = { get: jest.fn().mockReturnValue(template) } as unknown as Reflector;
  const context = { getHandler: () => handler } as unknown as ExecutionContext;
  return { context, reflector };
};

describe('SuccessInterceptor', () => {
  it('일반 응답은 { success: true, data } 형태로 래핑한다', (done) => {
    const { context, reflector } = makeCtx(undefined);
    const interceptor = new SuccessInterceptor(reflector);
    const handler: CallHandler = { handle: () => of({ id: 1 }) };

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: { id: 1 } });
      done();
    });
  });

  it('@Render 템플릿이 있는 핸들러는 원본 데이터를 그대로 반환한다', (done) => {
    const { context, reflector } = makeCtx('profile');
    const interceptor = new SuccessInterceptor(reflector);
    const handler: CallHandler = { handle: () => of({ username: 'alice' }) };

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({ username: 'alice' });
      done();
    });
  });
});
