import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './services/appointment.service';
import { PrismaService } from '../prisma/prisma.service';
import { StrikeService } from '../strikes/services/strike.service';
import { StrikesModule } from '../strikes/strikes.module';

@Module({
  imports: [StrikesModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, PrismaService, StrikeService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
