import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const allowedOrigins = [
    configService.get<string>('FRONTEND_URL'),
    configService.get<string>('DEPLOYED_FRONTEND_URL'),
  ].filter((origin): origin is string => Boolean(origin));

  app.enableCors({
    origin: allowedOrigins,
  });

  await app.listen(configService.get<number>('PORT') ?? 4000);
}
bootstrap();