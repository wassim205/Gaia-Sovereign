/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

describe('Auth Endpoints (e2e) - GS-29', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-e2e' } },
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'teste2euser',
          email: 'test-e2e@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe('test-e2e@example.com');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should reject duplicate email', async () => {
      const userData = {
        username: 'teste2euser1',
        email: 'test-e2e-dup@example.com',
        password: 'SecurePass123!',
      };

      const firstResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userData);
      
      expect(firstResponse.status).toBe(201);

      const dupResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...userData, username: 'differentuser' });
      
      expect(dupResponse.status).toBe(400);
      expect(dupResponse.body.message).toBe('Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'teste2elogin',
          email: 'test-e2e-login@example.com',
          password: 'SecurePass123!',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test-e2e-login@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.email).toBe('test-e2e-login@example.com');
    });

    it('should reject invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test-e2e-login@example.com',
          password: 'Wrong!',
        })
        .expect(401);
    });
  });
});
