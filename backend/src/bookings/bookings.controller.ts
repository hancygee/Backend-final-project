import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';

import type { Request } from 'express';

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../generated/prisma/enums';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
// Authenticated request type
type AuthenticatedRequest = Request & {
  user: {
    sub: number;
    role: 'USER' | 'ADMIN';
  };
};

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
  ) {}

  // ==========================================
  // FR-17: Create a booking
  // POST /bookings
  // Authenticated users only
  // ==========================================
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    const userId = req.user.sub;

    return this.bookingsService.create(
      userId,
      createBookingDto,
    );
  }

  // ==========================================
  // FR-23: Get all bookings of current user
  // GET /bookings
  // Authenticated users only
  // ==========================================
  @Get()
  @UseGuards(JwtAuthGuard)
  async findMyBookings(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingsService.findMyBookings(
      req.user.sub,
    );
  }

  // ==========================================
  // FR-24: Get one booking of current user
  // GET /bookings/:id
  // Authenticated users only
  // ==========================================
  
@Patch('admin/:id/status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async updateStatus(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateBookingStatusDto,
) {
  return this.bookingsService.updateStatus(
    id,
    dto.status,
  );
}


  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findMyBookingById(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.findMyBookingById(
      req.user.sub,
      id,
    );
  }
  
  // FR-25: Admin-only booking list
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAllForAdmin() {
    return this.bookingsService.findAllForAdmin();
  }
 
@Patch(':id/cancel')
@UseGuards(JwtAuthGuard)
async cancelMyBooking(
  @Req() req: AuthenticatedRequest,
  @Param('id', ParseIntPipe) id: number,
) {
  return this.bookingsService.cancelMyBooking(
    req.user.sub,
    id,
  );
}


}
