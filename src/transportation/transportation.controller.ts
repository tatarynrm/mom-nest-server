import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TransportationService } from './transportation.service';
import { CreateTransportationDto } from './dto/create-transportation.dto';
import { UpdateTransportationDto } from './dto/update-transportation.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('transportations')
export class TransportationController {
  constructor(private readonly transportationService: TransportationService) {}

  @Post()
  async create(@Body() dto: CreateTransportationDto) {
    return this.transportationService.create(dto);
  }

  @Get()
  async getTransportations(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('q') q?: string,
  ) {
    return this.transportationService.getAll(Number(page), Number(limit), q);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.transportationService.remove(id);
    return { message: 'Запис видалено успішно' };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateTransportationDto,
  ) {
    return this.transportationService.update(id, updateData);
  }

@Get('monthly-earnings')
async getMonthlyEarnings(
  @Query('page') page = 1,
  @Query('limit') limit = 10
) {
  return this.transportationService.getMonthlyEarnings(Number(page), Number(limit));
}
}
