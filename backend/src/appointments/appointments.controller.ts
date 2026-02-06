import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './services/appointment.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto, CancelAppointmentDto } from './dto/appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: any) {
    return this.appointmentsService.createAppointment({
      ...dto,
      patientId: dto.patientId || user.id,
    });
  }

  @Get('upcoming')
  @UseGuards(JwtAuthGuard)
  async getUpcoming(@CurrentUser() user: any) {
    return this.appointmentsService.getUpcomingAppointments(user.id, user.role);
  }

  @Get('patient/:patientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY', 'PROFESSIONAL')
  async getPatientAppointments(@Param('patientId') patientId: string) {
    return this.appointmentsService.getPatientAppointments(patientId);
  }

  @Get('professional')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY', 'PROFESSIONAL')
  async getProfessionalAppointments(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.getProfessionalAppointments(user.id, startDate, endDate);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.appointmentsService.getAppointmentById(id, user.id, user.role);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SECRETARY', 'PROFESSIONAL')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.updateStatus(id, dto, user.id, user.role);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.cancelAppointment(id, dto, user.id, user.role);
  }
}
