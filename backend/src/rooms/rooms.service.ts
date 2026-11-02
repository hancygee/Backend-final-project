import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '../generated/prisma/enums';
import { CreateRoomDto } from './dto/create-room.dto';
import { SearchRoomsDto } from './dto/search-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  // FR-12: Get all active rooms
  async findAll() {
    return this.prisma.room.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  // FR-13: Get one room by ID
  async findOne(id: number) {
    const room = await this.prisma.room.findFirst({
      where: {
        id,
        isActive: true,
      },
    });

    if (!room) {
      throw new NotFoundException(
        `Room with ID ${id} not found`,
      );
    }

    return room;
  }

  async searchAvailableRooms(dto: SearchRoomsDto) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (
      !Number.isFinite(checkIn.getTime()) ||
      !Number.isFinite(checkOut.getTime()) ||
      checkIn >= checkOut
    ) {
      throw new BadRequestException(
        'Check-out must be later than check-in',
      );
    }

    const conflictingRoomIds = await this.prisma.booking.findMany({
      where: {
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
      select: {
        roomId: true,
      },
      distinct: ['roomId'],
    });

    const excludedRoomIds = conflictingRoomIds.map(
      ({ roomId }) => roomId,
    );

    return this.prisma.room.findMany({
      where: {
        isActive: true,
        ...(dto.capacity !== undefined && {
          capacity: {
            gte: dto.capacity,
          },
        }),
        ...(excludedRoomIds.length > 0 && {
          id: {
            notIn: excludedRoomIds,
          },
        }),
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  // FR-8: Create a new room (Admin only)
  async create(createRoomDto: CreateRoomDto) {
    const room = await this.prisma.room.create({
      data: {
        name: createRoomDto.name,
        description: createRoomDto.description,
        capacity: createRoomDto.capacity,
        pricePerNight: createRoomDto.pricePerNight,
      },
    });

    return {
      message: 'Room created successfully',
      data: room,
    };
  }

  
async update(id: number, updateRoomDto: UpdateRoomDto) {
  const existingRoom = await this.prisma.room.findUnique({
    where: { id },
  });

  if (!existingRoom) {
    throw new NotFoundException(
      `Room with ID ${id} not found`,
    );
  }

  const updatedRoom = await this.prisma.room.update({
    where: { id },
    data: updateRoomDto,
  });

  return {
    message: 'Room updated successfully',
    data: updatedRoom,
  };
}

async deactivate(id: number) {
  const room = await this.prisma.room.findUnique({
    where: { id },
  });

  if (!room) {
    throw new NotFoundException(
      `Room with ID ${id} not found`,
    );
  }

  if (!room.isActive) {
    return {
      message: 'Room is already deactivated',
      data: room,
    };
  }

  const updatedRoom = await this.prisma.room.update({
    where: { id },
    data: {
      isActive: false,
    },
  });

  return {
    message: 'Room deactivated successfully',
    data: updatedRoom,
  };
}


async updateImage(id: number, filename: string) {
  const room = await this.prisma.room.findUnique({
    where: { id },
  });

  if (!room) {
    throw new NotFoundException(
      `Room with ID ${id} not found`,
    );
  }

  const imageUrl = `/uploads/rooms/${filename}`;

  const updatedRoom = await this.prisma.room.update({
    where: { id },
    data: { imageUrl },
  });

  return {
    message: 'Room image uploaded successfully',
    data: updatedRoom,
  };
}

}
