import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { validateEnvironment } from './config/environment.config';

async function bootstrap() {
  // Validate environment variables
  const env = validateEnvironment();

  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: env.NEXT_PUBLIC_API_URL || true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  await app.listen(env.BACKEND_PORT);
  console.log(`🚀 API is running on: http://localhost:${env.BACKEND_PORT}/api`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
