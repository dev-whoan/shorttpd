import { SelectableJwtAuthGuard } from './auth/jwt/auth.guard';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as expressBasicAuth from 'express-basic-auth';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filter/http/http-exception.filter';
import { SuccessInterceptor } from './common/interceptor/success/success.interceptor';

class Application {
  private logger = new Logger('Shorttpd');
  private DEV_MODE: boolean;
  private PORT: string;
  private corsOriginList: string[];
  private ADMIN_USER: string;
  private ADMIN_PASSWORD: string;
  private USE_AUTH: string;

  constructor(private server: NestExpressApplication) {
    this.server = server;

    if (
      process.env.ADMIN_PAGE_PREFIX &&
      (process.env.ADMIN_PAGE_PREFIX === '' ||
        process.env.ADMIN_PAGE_PREFIX === '/')
    ) {
      this.logger.error('Set "ADMIN_PAGE_PREFIX" not to be empty and [/]');
      throw new Error('🆘 Set "ADMIN_PAGE_PREFIX" not to be empty and [/]');
    }
    if (!process.env.JWT_SECRET) this.logger.error('Set "JWT_SECRET" env');
    this.DEV_MODE = process.env.NODE_ENV === 'production' ? false : true;
    this.PORT = process.env.PORT || '5000';
    this.corsOriginList = process.env.CORS_ORIGIN_LIST
      ? process.env.CORS_ORIGIN_LIST.split(',').map((origin) => origin.trim())
      : ['*'];
    this.ADMIN_USER = process.env.ADMIN_USERNAME || 'shorttpd';
    this.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'shorttpd_password';
    this.USE_AUTH = process.env.USE_AUTH || 'no';
  }

  private setUpBasicAuth() {
    this.server.use(
      [process.env.ADMIN_PAGE_PREFIX],
      expressBasicAuth({
        challenge: true,
        users: {
          [this.ADMIN_USER]: this.ADMIN_PASSWORD,
        },
      }),
    );
  }

  private async setUpGlobalMiddleware() {
    this.server.enableCors({
      origin: this.corsOriginList,
      credentials: true,
    });
    this.server.use(cookieParser());
    this.setUpBasicAuth();
    this.server.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );

    this.server.use(passport.initialize());
    // this.server.use(passport.session());

    this.server.useStaticAssets(join(__dirname, '..', 'public'));
    this.server.setBaseViewsDir(join(__dirname, '..', 'views'));
    this.server.setViewEngine('hbs');

    this.logger.log('Setting Logger Middleware...');

    //* Set Global Guard
    if (this.USE_AUTH === 'yes')
      this.server.useGlobalGuards(new SelectableJwtAuthGuard(new Reflector()));

    this.logger.log('Setting Global Interceptors...');

    this.server.useGlobalInterceptors(new SuccessInterceptor());
    this.logger.log('✅ SuccessInterceptor Ok');

    this.logger.log('Setting Global Filters...');
    this.server.useGlobalFilters(new HttpExceptionFilter());
    this.logger.log('✅ HttpExceptionFilter Ok');
  }

  async boostrap() {
    this.logger.log('Setting Global Middleware...');
    await this.setUpGlobalMiddleware();
    this.logger.log('✅ SetUpGlobalMiddleware Ok');
    await this.server.listen(this.PORT);
  }

  startLog() {
    if (this.DEV_MODE) {
      this.logger.log(`✅ Server on http://localhost:${this.PORT}`);
    } else {
      this.logger.log(`✅ Server on port ${this.PORT}...`);
    }
  }

  errorLog(error: string) {
    this.logger.error(`🆘 Server error ${error}`);
  }
}

async function init(): Promise<void> {
  const server = await NestFactory.create<NestExpressApplication>(AppModule);
  // const server = await NestFactory.create<NestExpressApplication>(AppModule);
  const app = new Application(server);
  await app.boostrap();
  app.startLog();
}

init().catch((error) => {
  new Logger('init').error(error);
});
