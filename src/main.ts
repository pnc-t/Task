import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import * as fs from 'fs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // アップロードディレクトリの作成
  const uploadsDir = join(process.cwd(), 'uploads', 'avatars');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 静的ファイル配信
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // グローバルパイプの設定
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // グローバル例外フィルター（エラーログ）
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORSの設定
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // セキュリティヘッダーの設定
  app.use((req: any, res: any, next: any) => {
    // XSS対策
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // クリックジャッキング対策
    res.setHeader('X-Frame-Options', 'DENY');
    // コンテンツタイプスニッフィング対策
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // リファラー情報の制限
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // HSTS（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
    );
    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    next();
  });

  // Cookie パーサーミドルウェア（JWT Cookie のため必須）
  app.use(cookieParser());

  // CSRF保護について:
  // HttpOnly Cookie + SameSite=strict を使用しているため、従来のCSRFトークン方式は不要です。
  // SameSite=strict により、クロスサイトリクエストではCookieが送信されないため、
  // CSRF攻撃は防止されます。

  // Prismaのシャットダウンフック
  const prismaService = app.get(PrismaService);
  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();