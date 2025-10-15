import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';


export class UpdateTransportationDto {
  @IsOptional()
  @IsDateString()
  cargo_date?: string;

  @IsOptional()
  @IsString()
  location_from?: string;

  @IsOptional()
  @IsString()
  location_to?: string;

  @IsOptional()
  @IsString()
  driver?: string;

  @IsOptional()
  @IsString()
  truck?: string;

  @IsOptional()
  @IsString()
  truck_owner?: string;

  @IsOptional()
  @IsNumber()

  price?: number;

  @IsOptional()
  @IsNumber()

  cost?: number;

  @IsOptional()
  @IsNumber()

  status?: number;

  @IsOptional()
  @IsString()
  transportation_comment?: string;
}
