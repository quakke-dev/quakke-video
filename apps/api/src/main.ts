import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';

if (!process.env.APP_ENV) {
  loadEnvFile(resolve(process.cwd(), '.env.local'));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';

  app.enableShutdownHooks();
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`API is running on http://localhost:${port}/${globalPrefix}`, 'Bootstrap');
}

void bootstrap();
