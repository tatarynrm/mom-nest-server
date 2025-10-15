import { Module } from '@nestjs/common';
import { TransportationService } from './transportation.service';
import { TransportationController } from './transportation.controller';
import { DatabaseService } from 'src/database/database.service';

@Module({
  controllers: [TransportationController],
  providers: [TransportationService,DatabaseService],
})
export class TransportationModule {}
