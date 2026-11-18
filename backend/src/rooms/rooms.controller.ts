import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { mkdir, unlink, writeFile } from 'fs/promises';

import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { SearchRoomsDto } from './dto/search-room.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../generated/prisma/enums';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
  ) {}

  // ==========================================
  // FR-12: Get all active rooms
  // GET /rooms
  // Public access
  // ==========================================
  @Get()
  async findAll() {
    return this.roomsService.findAll();
  }

  @Get('search')
  async searchAvailableRooms(
    @Query() searchRoomsDto: SearchRoomsDto,
  ) {
    return this.roomsService.searchAvailableRooms(searchRoomsDto);
  }

  // ==========================================
  // FR-13: Get room details by ID
  // GET /rooms/:id
  // Public access
  // ==========================================
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.roomsService.findOne(id);
  }

  // ==========================================
  // FR-8: Create a new room
  // POST /rooms
  // Admin only
  // ==========================================
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createRoomDto: CreateRoomDto,
  ) {
    return this.roomsService.create(createRoomDto);
  }

  // ==========================================
  // FR-9: Update room information
  // PATCH /rooms/:id
  // Admin only
  // ==========================================
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(
      id,
      updateRoomDto,
    );
  }

  // ==========================================
  // FR-10: Deactivate a room (soft delete)
  // DELETE /rooms/:id
  // Admin only
  // ==========================================
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.roomsService.deactivate(id);
  }

  // ==========================================
  // FR-14: Upload a room image
  // FR-15: Store room image information
  // POST /rooms/:id/image
  // Admin only
  // ==========================================
  @Post(':id/image')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^image\/(jpeg|png|webp)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024,
        })
        .build({
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    )
    file: Express.Multer.File,
  ) {
    // Check whether the room exists and is active
    await this.roomsService.findOne(id);

    // Choose file extension based on validated MIME type
    const extensionByMime: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };

    const extension = extensionByMime[file.mimetype];

    if (!extension) {
      throw new BadRequestException(
        'Unsupported image type',
      );
    }

    // Generate a unique filename
    const filename = `${randomUUID()}${extension}`;

    // Set upload directory
    const uploadPath = join(
      process.cwd(),
      'uploads',
      'rooms',
    );

    // Create directory if it does not exist
    await mkdir(uploadPath, {
      recursive: true,
    });

    // Save image to disk
    const filePath = join(uploadPath, filename);

    await writeFile(filePath, file.buffer);

    // Save image URL to MySQL
    try {
      return await this.roomsService.updateImage(
        id,
        filename,
      );
    } catch (error) {
      // Remove file if database update fails
      await unlink(filePath).catch(() => undefined);
      throw error;
    }
  }
}
