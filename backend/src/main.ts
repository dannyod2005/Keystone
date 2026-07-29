import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Since the frontend (CRA, localhost:3000) and this backend now run on
  // different ports, the browser treats them as different "origins" and
  // blocks requests between them by default. enableCors() allows it.
  app.enableCors();

  // Moved off 3000 since Create React App's dev server also defaults to
  // that port — keeping them distinct avoids a port clash when both run
  // at the same time locally.
  await app.listen(4000);
}
bootstrap();