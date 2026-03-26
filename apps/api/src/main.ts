import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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

  // Setup Swagger/OpenAPI documentation (GS-154, GS-157)
  if (env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Gaia Sovereign API')
      .setDescription(
        'Personal Data Vault API - Manage your sensitive information with privacy-first approach. Users control which apps access their data.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token required for authentication',
        },
        'bearer',
      )
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User profile and access management')
      .addTag('Vault', 'Secure vault operations')
      .addTag('Tokens', 'Access token management')
      .addTag('Consent', 'Data consent requests')
      .addTag('Third-Party Apps', 'Third-party application management')
      .addTag('Audit', 'Audit logs and tracking')
      .addTag('Admin', 'Administrative operations')
      .setContact(
        'Gaia Sovereign Team',
        'https://github.com/wassim205/Gaia-Sovereign',
        'support@gaiasovereign.dev',
      )
      .setLicense(
        'UNLICENSED',
        'https://github.com/wassim205/Gaia-Sovereign/blob/main/LICENSE',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
      },
      customCssUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.bundle.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.standalone.min.js',
      ],
    });

    console.log(
      `📚 Swagger documentation available at: http://localhost:${env.BACKEND_PORT}/api/docs`,
    );
  }

  await app.listen(env.BACKEND_PORT);
  console.log(`🚀 API is running on: http://localhost:${env.BACKEND_PORT}/api`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
