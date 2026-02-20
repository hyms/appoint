import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './services/appointment.service';
import { AppointmentAuditService } from './services/appointment-audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { StrikeService } from '../strikes/services/strike.service';
import { StrikesModule } from '../strikes/strikes.module';
import { AuthorizationService } from '../common/services/authorization.service';

@Module({
  imports: [StrikesModule],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    AppointmentAuditService,
    PrismaService,
    StrikeService,
    AuthorizationService,
  ],
  exports: [AppointmentsService, AppointmentAuditService],
})
export class AppointmentsModule {}
