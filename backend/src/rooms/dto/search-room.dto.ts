import { IsDateString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchRoomsDto {
  @ApiProperty({ example: '2026-12-01T14:00:00.000Z' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2026-12-05T11:00:00.000Z' })
  @IsDateString()
  checkOut: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;
}