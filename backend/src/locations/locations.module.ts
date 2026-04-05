import { Module } from '@nestjs/common';
import { LocationController } from './locations.controller';
import { LocationService } from './services/location.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
