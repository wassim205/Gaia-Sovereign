import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.BACKEND_PORT || 4000;
  await app.listen(port);
  console.log(`🚀 API is running on: http://localhost:${port}`);
}
bootstrap();
