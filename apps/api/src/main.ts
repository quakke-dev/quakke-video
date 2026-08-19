import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';

import fastifyCookie from '@fastify/cookie';

import { AppModule } from './app/app.module';

if (!process.env.APP_ENV) {
  loadEnvFile(resolve(process.cwd(), '.env.local'));
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await app.register(fastifyCookie);

  const globalPrefix = 'api';

  app.enableShutdownHooks();
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`API is running on http://localhost:${port}/${globalPrefix}`, 'Bootstrap');
}

void bootstrap();
