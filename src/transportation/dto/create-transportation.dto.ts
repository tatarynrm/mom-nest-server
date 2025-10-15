import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateTransportationDto {
  @IsDateString()
  cargo_date: string;

  @IsString()
  @IsNotEmpty()
  location_from: string;

  @IsString()
  @IsNotEmpty()
  location_to: string;

  @IsString()
  @IsNotEmpty()
  driver: string;

  @IsString()
  @IsNotEmpty()
  truck: string;

  @IsString()
  @IsNotEmpty()
  truck_owner: string;

  @IsInt()
  price: number;

  @IsInt()
  cost: number;

  @IsInt()
  @Min(1)
  @Max(4)
  status: number;

  @IsString()
  @IsOptional()
  transportation_comment?: string;

  @IsInt()
  @IsOptional()
  user_id?: number; // можна додати, якщо треба
}
