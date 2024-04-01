import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('CODE:RED')
    .setDescription('CODE:RED')
    .setVersion('1.0')
    .addTag('CODE:RED')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        name: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  app.useGlobalPipes(
    // DTO를 사용하는 것의 핵심은 DTO 객체 안에서 클라이언트의 전달 값에 대한 유효성 검사가 자동으로 되어야 하는 것
    new ValidationPipe({
      // DTO가 이러한 역할을 할 수 있도록 돕는 것이 바로 ValidationPipe
      transform: true, // 컨트롤러에서 유저의 입력값을 자동으로 DTO 객체로 변환해주는 옵션
    }),
  );
  const PORT = 3000;
  await app.listen(PORT);
  Logger.log(`${PORT}번 포트로 서버 실행 중...`);
}
bootstrap();
