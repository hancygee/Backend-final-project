import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { config } from 'dotenv';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Hotel booking API integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  async function clearTestData() {
    await prisma.notification.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.room.deleteMany();
    await prisma.user.deleteMany();
  }

  beforeAll(async () => {
    config({ path: '.env.test', override: true, quiet: true });

    const databaseUrl =
      process.env.TEST_DATABASE_URL ??
      process.env.DATABASE_URL ??
      'mysql://hotel_test_user:localTestPassword@127.0.0.1:3308/hotel_booking_test';
    process.env.DATABASE_URL = databaseUrl;

    if (new URL(databaseUrl).pathname !== '/hotel_booking_test') {
      throw new Error(
        'E2E tests only run against the hotel_booking_test database',
      );
    }

    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'local-only-e2e-secret';
    }

    execFileSync(
      process.execPath,
      [
        join(
          process.cwd(),
          'node_modules',
          'prisma',
          'build',
          'index.js',
        ),
        'migrate',
        'deploy',
      ],
      { stdio: 'inherit', env: process.env },
    );

    const { AppModule } = await import('../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    prisma = app.get(PrismaService);
    await app.init();
    await clearTestData();
  });

  afterAll(async () => {
    if (prisma) {
      try {
        await clearTestData();
      } finally {
        await app.close();
      }
    }
  });

  it('supports authentication, room management, search, and booking flows', async () => {
    const server = app.getHttpServer();
    const credentials = {
      name: 'E2E User',
      email: `e2e-${randomUUID()}@hotel.test`,
      password: 'TestPassword123!',
    };

    const registration = await request(server)
      .post('/auth/register')
      .send(credentials)
      .expect(201);
    expect(registration.body.data.email).toBe(credentials.email);
    const registeredUser = await prisma.user.findUnique({
      where: { email: credentials.email },
    });
    expect(registeredUser).toMatchObject({
      name: credentials.name,
      role: 'USER',
    });
    expect(registeredUser?.passwordHash).not.toBe(credentials.password);

    const userLogin = await request(server)
      .post('/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    const userToken = userLogin.body.access_token as string;
    const userId = userLogin.body.user.id as number;

    await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe(credentials.email);
      });

    await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
    });
    await expect(
      prisma.user.findUnique({ where: { id: userId } }),
    ).resolves.toMatchObject({ role: 'ADMIN' });

    const adminLogin = await request(server)
      .post('/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    const adminToken = adminLogin.body.access_token as string;

    const roomResponse = await request(server)
      .post('/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Test Room',
        description: 'Room created by the integration test',
        capacity: 2,
        pricePerNight: 180,
      })
      .expect(201);
    const roomId = roomResponse.body.data.id as number;
    await expect(
      prisma.room.findUnique({ where: { id: roomId } }),
    ).resolves.toMatchObject({
      name: 'E2E Test Room',
      capacity: 2,
      isActive: true,
    });

    await request(server)
      .patch(`/rooms/${roomId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated E2E Test Room' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.name).toBe('Updated E2E Test Room');
      });
    await expect(
      prisma.room.findUnique({ where: { id: roomId } }),
    ).resolves.toMatchObject({ name: 'Updated E2E Test Room' });

    await request(server)
      .get(`/rooms/${roomId}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe('Updated E2E Test Room');
      });

    const searchQuery = {
      checkIn: '2030-08-01',
      checkOut: '2030-08-05',
      capacity: 2,
    };
    const availableBeforeBooking = await request(server)
      .get('/rooms/search')
      .query(searchQuery)
      .expect(200);
    expect(
      availableBeforeBooking.body.map((room: { id: number }) => room.id),
    ).toContain(roomId);

    const bookingResponse = await request(server)
      .post('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        roomId,
        checkIn: searchQuery.checkIn,
        checkOut: searchQuery.checkOut,
      })
      .expect(201);
    const bookingId = bookingResponse.body.data.id as number;
    await expect(
      prisma.booking.findUnique({ where: { id: bookingId } }),
    ).resolves.toMatchObject({
      userId,
      roomId,
      status: 'PENDING',
    });
    await expect(
      prisma.notification.findFirst({
        where: { bookingId, type: 'BOOKING_CREATED' },
      }),
    ).resolves.toMatchObject({ userId });

    await request(server)
      .get('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.map((booking: { id: number }) => booking.id)).toContain(
          bookingId,
        );
      });

    await request(server)
      .get(`/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(bookingId);
      });

    await request(server)
      .get('/bookings/admin/all')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.map((booking: { id: number }) => booking.id)).toContain(
          bookingId,
        );
      });

    await request(server)
      .patch(`/bookings/admin/${bookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.status).toBe('APPROVED');
      });
    await expect(
      prisma.booking.findUnique({ where: { id: bookingId } }),
    ).resolves.toMatchObject({ status: 'APPROVED' });

    const availableWhileBooked = await request(server)
      .get('/rooms/search')
      .query(searchQuery)
      .expect(200);
    expect(
      availableWhileBooked.body.map((room: { id: number }) => room.id),
    ).not.toContain(roomId);

    await request(server)
      .patch(`/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.status).toBe('CANCELLED');
      });
    await expect(
      prisma.booking.findUnique({ where: { id: bookingId } }),
    ).resolves.toMatchObject({ status: 'CANCELLED' });
    await expect(
      prisma.notification.findFirst({
        where: { bookingId, type: 'BOOKING_CANCELLED' },
      }),
    ).resolves.toMatchObject({ userId });

    const availableAfterCancellation = await request(server)
      .get('/rooms/search')
      .query(searchQuery)
      .expect(200);
    expect(
      availableAfterCancellation.body.map((room: { id: number }) => room.id),
    ).toContain(roomId);

    await request(server)
      .delete(`/rooms/${roomId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await expect(
      prisma.room.findUnique({ where: { id: roomId } }),
    ).resolves.toMatchObject({ isActive: false });
    await request(server).get(`/rooms/${roomId}`).expect(404);
  });
});
