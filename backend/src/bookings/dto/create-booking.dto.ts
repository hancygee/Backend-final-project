
import {
  IsInt,
  IsPositive,
  IsDateString,
} from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  @IsPositive()
  roomId: number;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;
}
