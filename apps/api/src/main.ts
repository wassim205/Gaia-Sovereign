import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { validateEnvironment } from './config/environment.config';
import helmet from 'helmet';

async function bootstrap() {
  // Validate environment variables
  const env = validateEnvironment();

  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance() as {
    set: (setting: string, value: number) => void;
  };
  expressApp.set('trust proxy', env.TRUST_PROXY ? 1 : 0);
  app.use(helmet());

  const allowedOrigins = env.CORS_ALLOWED_ORIGINS;
  const corsOriginDelegate = (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'), false);
  };

  // Enable CORS with strict allow-list
  app.enableCors({
    origin: corsOriginDelegate,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Client-Id',
    ],
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
