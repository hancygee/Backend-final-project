import { Controller, Get, Param, ParseIntPipe, Patch, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /notifications - Get current user notifications
  @Get()
  async getMyNotifications(@Request() req: any) {
    const userId = req.user.sub;
    return this.notificationsService.findAllForUser(userId);
  }

  // PATCH /notifications/:id/read - Mark notification as read
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    return this.notificationsService.markAsRead(id, userId);
  }
}