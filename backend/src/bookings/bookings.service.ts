
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus, NotificationType } from '../generated/prisma/enums';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateBookingDto) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    // FR-19: Validate date order
    if (
      !Number.isFinite(checkIn.getTime()) ||
      !Number.isFinite(checkOut.getTime()) ||
      checkIn >= checkOut
    ) {
      throw new BadRequestException(
        'Check-out must be later than check-in',
      );
    }

    // Use a transaction and lock the room row to serialize
    // concurrent booking requests for the same room.
    return this.prisma.$transaction(async (tx) => {
      const rooms = await tx.$queryRaw<
        Array<{ id: number; isActive: number | boolean }>
      >`
        SELECT id, isActive
        FROM Room
        WHERE id = ${dto.roomId}
        FOR UPDATE
      `;

      const room = rooms[0];

      if (!room || !Boolean(room.isActive)) {
        throw new NotFoundException(
          'Room not found or unavailable',
        );
      }

      // FR-20: Check overlapping reservations.
      // Adjacent bookings are allowed.
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          roomId: dto.roomId,
          status: {
            in: [
              BookingStatus.PENDING,
              BookingStatus.APPROVED,
              BookingStatus.PAID,
            ],
          },
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        },
      });

      if (conflictingBooking) {
        throw new ConflictException(
          'Room is already booked for the selected dates',
        );
      }

      // FR-17, FR-18, FR-22
      const booking = await tx.booking.create({
        data: {
          userId,
          roomId: dto.roomId,
          checkIn,
          checkOut,
          status: BookingStatus.PENDING,
        },
      });

      // FR-30: Record booking-created notification
      await tx.notification.create({
        data: {
          userId,
          bookingId: booking.id,
          type: NotificationType.BOOKING_CREATED,
          message: 'Your booking has been created successfully',
        },
      });

      return {
        message: 'Booking created successfully',
        data: booking,
      };
    });
  }

  
  // FR-23: Retrieve the authenticated user's bookings
  async findMyBookings(userId: number) {
    return this.prisma.booking.findMany({
      where: {
        userId,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            capacity: true,
            pricePerNight: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // FR-24: Retrieve one booking belonging to the user
  async findMyBookingById(userId: number, bookingId: number) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            capacity: true,
            pricePerNight: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(
        `Booking with ID ${bookingId} not found`,
      );
    }

    return booking;
  }
  
  // FR-25: Admin can view all bookings
  async findAllForAdmin() {
    return this.prisma.booking.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            capacity: true,
            pricePerNight: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  
async updateStatus(
  bookingId: number,
  status: BookingStatus,
) {
  return this.prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(
        `Booking with ID ${bookingId} not found`,
      );
    }

    // Only allow cancellation or approval from PENDING
    if (
      status !== booking.status &&
      (
        booking.status !== BookingStatus.PENDING ||
        (status !== BookingStatus.APPROVED &&
          status !== BookingStatus.CANCELLED)
      )
    ) {
      throw new BadRequestException(
        'Invalid booking status transition',
      );
    }

    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    if (
      status === BookingStatus.CANCELLED &&
      booking.status !== BookingStatus.CANCELLED
    ) {
      await tx.notification.create({
        data: {
          userId: booking.userId,
          bookingId,
          type: NotificationType.BOOKING_CANCELLED,
          message: 'Your booking has been cancelled',
        },
      });
    }

    return {
      message: 'Booking status updated successfully',
      data: updated,
    };
  });
}
  
async cancelMyBooking(userId: number, bookingId: number) {
  return this.prisma.$transaction(async (tx) => {
    // Lock the booking row to prevent simultaneous status changes
    const rows = await tx.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM Booking
      WHERE id = ${bookingId}
      FOR UPDATE
    `;

    if (rows.length === 0) {
      throw new NotFoundException('Booking not found');
    }

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });

    // Do not reveal another user's booking
    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.APPROVED
    ) {
      throw new BadRequestException(
        'This booking cannot be cancelled',
      );
    }

    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    // FR-31: Record booking cancellation
    await tx.notification.create({
      data: {
        userId,
        bookingId,
        type: NotificationType.BOOKING_CANCELLED,
        message: 'Your booking has been cancelled',
      },
    });

    return {
      message: 'Booking cancelled successfully',
      data: updated,
    };
  });
}
  
}
