import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
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
  constructor(private server: NestExpressApplication) {
    this.server = server;

    if (!process.env.JWT_SECRET) this.logger.error('Set "JWT_SECRET" env');
    this.DEV_MODE = process.env.NODE_ENV === 'production' ? false : true;
    this.PORT = process.env.PORT || '5000';
    this.corsOriginList = process.env.CORS_ORIGIN_LIST
      ? process.env.CORS_ORIGIN_LIST.split(',').map((origin) => origin.trim())
      : ['*'];
    this.ADMIN_USER = process.env.ADMIN_USER || 'shorttpd';
    this.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'shorttpd_password';
  }

  private setUpBasicAuth() {
    this.server.use(
      ['/docs', '/docs-json'],
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
