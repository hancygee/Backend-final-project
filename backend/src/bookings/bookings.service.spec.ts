import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;

  const mockTransaction = {
    $queryRaw: jest.fn(),
    booking: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  };

  const mockPrismaService = {
    $transaction: jest.fn(
      (callback: (tx: typeof mockTransaction) => unknown) =>
        callback(mockTransaction),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.each([
    {
      checkIn: 'not-a-date',
      checkOut: '2026-06-05',
    },
    {
      checkIn: '2026-06-05',
      checkOut: '2026-06-01',
    },
    {
      checkIn: '2026-06-01',
      checkOut: '2026-06-01',
    },
  ])('should reject invalid booking dates: $checkIn to $checkOut', async (dates) => {
    await expect(
      service.create(1, { roomId: 1, ...dates }),
    ).rejects.toThrow(BadRequestException);
    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    { rooms: [] },
    { rooms: [{ id: 1, isActive: false }] },
  ])('should reject unavailable rooms', async ({ rooms }) => {
    mockTransaction.$queryRaw.mockResolvedValue(rooms);

    await expect(
      service.create(1, {
        roomId: 1,
        checkIn: '2026-06-01',
        checkOut: '2026-06-05',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(mockTransaction.booking.findFirst).not.toHaveBeenCalled();
  });

  it('should prevent overlapping bookings (double booking)', async () => {
    mockTransaction.$queryRaw.mockResolvedValue([
      { id: 1, isActive: true },
    ]);
    mockTransaction.booking.findFirst.mockResolvedValue({ id: 1 });

    await expect(
      service.create(1, {
        roomId: 1,
        checkIn: '2026-06-01',
        checkOut: '2026-06-05',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should create a booking and notification when the room is available', async () => {
    const booking = {
      id: 1,
      userId: 7,
      roomId: 2,
      status: 'PENDING',
    };
    mockTransaction.$queryRaw.mockResolvedValue([
      { id: 2, isActive: true },
    ]);
    mockTransaction.booking.findFirst.mockResolvedValue(null);
    mockTransaction.booking.create.mockResolvedValue(booking);

    await expect(
      service.create(7, {
        roomId: 2,
        checkIn: '2026-06-01',
        checkOut: '2026-06-05',
      }),
    ).resolves.toMatchObject({ data: booking });
    expect(mockTransaction.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 7,
        bookingId: booking.id,
        type: 'BOOKING_CREATED',
      }),
    });
  });
});