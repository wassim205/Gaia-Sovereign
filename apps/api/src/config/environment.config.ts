export interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;

  // Server
  BACKEND_PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // Frontend
  NEXT_PUBLIC_API_URL: string;
  CORS_ALLOWED_ORIGINS: string[];
  TRUST_PROXY: boolean;

  // CSRF / Cookie
  ENABLE_CSRF_PROTECTION: boolean;
  AUTH_COOKIE_NAME: string;
  CSRF_COOKIE_NAME: string;
}

export const validateEnvironment = (): EnvironmentConfig => {
  const required = [
    'DATABASE_URL',
    'BACKEND_PORT',
    'NODE_ENV',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  const corsAllowedOrigins = (
    process.env.CORS_ALLOWED_ORIGINS ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    DATABASE_URL: process.env.DATABASE_URL as string,
    BACKEND_PORT: parseInt(process.env.BACKEND_PORT || '4000', 10),
    NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
    JWT_SECRET: process.env.JWT_SECRET as string,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN as string,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    CORS_ALLOWED_ORIGINS: corsAllowedOrigins,
    TRUST_PROXY: process.env.TRUST_PROXY === 'true',
    ENABLE_CSRF_PROTECTION: process.env.ENABLE_CSRF_PROTECTION === 'true',
    AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME || 'auth_token',
    CSRF_COOKIE_NAME: process.env.CSRF_COOKIE_NAME || 'csrf_token',
  };
};
