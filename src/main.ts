import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = 3000;
  await app.listen(PORT);
  Logger.log(
    `${PORT}번 포트로 서버 실행 중... API Docs: http://localhost:3000/api`,
  );
}
bootstrap();
