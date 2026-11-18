
import {
  IsString,
  IsInt,
  IsPositive,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @IsPositive()
  capacity: number;

  @IsNumber()
  @Min(0)
  pricePerNight: number;
}
