import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
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
